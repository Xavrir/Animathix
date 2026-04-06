import asyncio
import logging
import re
import shutil
import sys
import tempfile
from pathlib import Path

from backend.config import settings

logger = logging.getLogger(__name__)


def _find_manim_bin() -> str:
    """Find the manim binary, preferring the one next to the running Python."""
    # Check same bin dir as the running Python interpreter
    python_bin_dir = Path(sys.executable).parent
    local_manim = python_bin_dir / "manim"
    if local_manim.exists():
        return str(local_manim)
    # Fall back to PATH
    found = shutil.which("manim")
    if found:
        return found
    return "manim"


MANIM_BIN = _find_manim_bin()

QUALITY_MAP = {
    "low": "l",
    "medium": "m",
    "high": "h",
    "low_quality": "l",
    "medium_quality": "m",
    "high_quality": "h",
}


def _find_scene_class(code: str) -> str:
    """Extract the scene class name from generated code."""
    match = re.search(r"class\s+(\w+)\s*\(.*(?:VoiceoverScene|Scene).*\)", code)
    if match:
        return match.group(1)
    return "ExplanationScene"


def _find_output_video(media_dir: str, scene_name: str) -> str | None:
    """Locate the rendered MP4 in Manim's output directory tree."""
    media_path = Path(media_dir)
    # Manim outputs to media/videos/<filename>/<quality>/<SceneName>.mp4
    candidates = list(media_path.rglob(f"{scene_name}.mp4"))
    if candidates:
        # Return the most recently modified one
        candidates.sort(key=lambda p: p.stat().st_mtime, reverse=True)
        return str(candidates[0].resolve())
    return None


async def render_manim_scene(
    code: str,
    media_dir: str | None = None,
    quality: str = "medium",
) -> tuple[bool, str, str | None]:
    """
    Write code to a temp file, run manim render, return result.

    Returns:
        (success, output_path_or_error_message, stderr)
    """
    media_dir = media_dir or settings.MEDIA_DIR
    quality_flag = QUALITY_MAP.get(quality, "m")
    scene_name = _find_scene_class(code)

    with tempfile.NamedTemporaryFile(
        mode="w",
        suffix=".py",
        prefix="animathix_",
        delete=False,
    ) as f:
        f.write(code)
        temp_path = f.name

    logger.info("Rendering scene %s from %s (quality: %s)", scene_name, temp_path, quality_flag)

    try:
        proc = await asyncio.create_subprocess_exec(
            MANIM_BIN,
            "render",
            f"-q{quality_flag}",
            "--media_dir",
            media_dir,
            temp_path,
            scene_name,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        stdout_bytes, stderr_bytes = await asyncio.wait_for(
            proc.communicate(),
            timeout=settings.RENDER_TIMEOUT,
        )

        stdout = stdout_bytes.decode(errors="replace")
        stderr = stderr_bytes.decode(errors="replace")

        if proc.returncode == 0:
            video_path = _find_output_video(media_dir, scene_name)
            if video_path:
                logger.info("Render successful: %s", video_path)
                return True, video_path, None
            return False, "Render succeeded but output video not found", stderr

        logger.warning("Render failed (exit %d): %s", proc.returncode, stderr[:500])
        return False, f"Manim render failed (exit code {proc.returncode})", stderr

    except asyncio.TimeoutError:
        logger.error("Render timed out after %ds", settings.RENDER_TIMEOUT)
        return False, f"Render timed out after {settings.RENDER_TIMEOUT}s", None

    finally:
        Path(temp_path).unlink(missing_ok=True)
