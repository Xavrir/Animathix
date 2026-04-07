import importlib
import logging
import os
import re
import shutil

from backend.config import settings
from backend.services.kokoro_client import get_kokoro_availability

logger = logging.getLogger(__name__)

# Check if sox binary is available (required by gTTS/manim-voiceover)
SOX_AVAILABLE = shutil.which("sox") is not None


def _configure_elevenlabs_env() -> None:
    api_key = os.getenv("ELEVEN_API_KEY") or settings.ELEVENLABS_API_KEY
    if api_key and not os.getenv("ELEVEN_API_KEY"):
        os.environ["ELEVEN_API_KEY"] = api_key


def _elevenlabs_runtime_ready() -> bool:
    _configure_elevenlabs_env()
    try:
        importlib.import_module("manim_voiceover.services.elevenlabs")
        return True
    except Exception as exc:
        logger.warning("ElevenLabs runtime import failed: %s", exc)
        return False


def get_speech_service_code(voice_id: str, provider: str) -> str:
    """Return Python code that sets up the speech service in a VoiceoverScene."""

    if provider == "kokoro":
        return "pass  # Kokoro audio is merged after render"

    if not SOX_AVAILABLE:
        logger.warning("sox not found — voiceover disabled, rendering video-only")
        return "pass  # TTS unavailable (sox not installed)"

    if provider == "elevenlabs":
        return (
            f"from manim_voiceover.services.elevenlabs import ElevenLabsService\n"
            f'        self.set_speech_service(ElevenLabsService(voice_id="{voice_id}"))'
        )

    if provider == "openai":
        return (
            f"from manim_voiceover.services.openai import OpenAIService\n"
            f'        self.set_speech_service(OpenAIService(voice="{voice_id}"))'
        )

    return (
        "from manim_voiceover.services.gtts import GTTSService\n"
        "        self.set_speech_service(GTTSService())"
    )


async def get_provider_availability() -> dict[str, dict[str, str | bool | None]]:
    kokoro = await get_kokoro_availability()

    elevenlabs_available = SOX_AVAILABLE and bool(
        os.getenv("ELEVEN_API_KEY") or settings.ELEVENLABS_API_KEY
    )
    openai_available = SOX_AVAILABLE and bool(settings.OPENAI_API_KEY)

    return {
        "kokoro": {
            "available": kokoro.available,
            "unavailable_reason": kokoro.reason,
        },
        "elevenlabs": {
            "available": elevenlabs_available,
            "unavailable_reason": None
            if elevenlabs_available
            else "Requires sox and ELEVEN_API_KEY/ELEVENLABS_API_KEY",
        },
        "openai": {
            "available": openai_available,
            "unavailable_reason": None
            if openai_available
            else "Requires sox and OPENAI_API_KEY",
        },
    }


def inject_speech_service(
    code: str,
    voice_id: str,
    provider: str,
    scene_durations: list[float] | None = None,
) -> str:
    """Replace the placeholder in generated Manim code with actual TTS setup.

    When sox is unavailable, strip out voiceover entirely and convert to
    a plain Scene so the video renders without audio.
    """
    if provider in {"kokoro", "elevenlabs"}:
        code = _strip_voiceover_dependencies(code)
        code = code.replace("(VoiceoverScene)", "(Scene)")
        code = code.replace(
            "# SPEECH_SERVICE_PLACEHOLDER",
            f"pass  # {provider} audio merged after render",
        )
        code = _strip_voiceover_blocks(code, scene_durations=scene_durations)
        code = _normalize_text_only_runtime(code)
        code = _optimize_silent_scene_timing(code)
        return code

    if not settings.INLINE_VOICEOVER_ENABLED:
        logger.warning("Inline voiceover disabled - rendering silent video")
        code = _strip_voiceover_dependencies(code)
        code = code.replace("(VoiceoverScene)", "(Scene)")
        code = code.replace(
            "# SPEECH_SERVICE_PLACEHOLDER", "pass  # Inline voiceover disabled"
        )
        code = _strip_voiceover_blocks(code)
        code = _normalize_text_only_runtime(code)
        code = _optimize_silent_scene_timing(code)
        return code

    if not SOX_AVAILABLE:
        code = _strip_voiceover_dependencies(code)
        code = code.replace("(VoiceoverScene)", "(Scene)")
        code = code.replace("# SPEECH_SERVICE_PLACEHOLDER", "pass  # TTS unavailable")
        code = _strip_voiceover_blocks(code)
        code = _normalize_text_only_runtime(code)
        code = _optimize_silent_scene_timing(code)
        return code

    if provider == "elevenlabs" and not _elevenlabs_runtime_ready():
        logger.warning("ElevenLabs SDK not importable - falling back to silent render")
        code = _strip_voiceover_dependencies(code)
        code = code.replace("(VoiceoverScene)", "(Scene)")
        code = code.replace(
            "# SPEECH_SERVICE_PLACEHOLDER", "pass  # ElevenLabs unavailable"
        )
        code = _strip_voiceover_blocks(code)
        code = _normalize_text_only_runtime(code)
        code = _optimize_silent_scene_timing(code)
        return code

    service_code = get_speech_service_code(voice_id, provider)
    return code.replace("# SPEECH_SERVICE_PLACEHOLDER", service_code)


def _strip_voiceover_dependencies(code: str) -> str:
    for pattern in [
        r"manim_voiceover",
        r"set_speech_service",
        r"GTTSService",
        r"OpenAIService",
        r"ElevenLabsService",
        r"AzureService",
        r"SpeechService",
        r"voiceover_cache",
        r"add_voiceover_text",
    ]:
        code = re.sub(rf"^.*{pattern}.*$", "", code, flags=re.MULTILINE)
    return code


def _normalize_text_only_runtime(code: str) -> str:
    code = code.replace("MathTex(", "Text(")
    code = re.sub(r"\bTex\(", "Text(", code)
    code = code.replace("TransformMatchingTex(", "Transform(")
    return code


def _optimize_silent_scene_timing(code: str) -> str:
    code = re.sub(
        r"self\.play\(FadeOut\(\*self\.mobjects\)\)",
        "self.play(FadeOut(*self.mobjects), run_time=0.2)",
        code,
    )
    code = re.sub(r"self\.wait\(\)", "self.wait(0.2)", code)
    return code


def _strip_voiceover_blocks(
    code: str,
    scene_durations: list[float] | None = None,
) -> str:
    """Convert 'with self.voiceover(text=...) as tracker:' blocks into flat code.

    Dedents the body of voiceover blocks and replaces tracker.duration with
    a fixed timing value.
    """
    lines = code.split("\n")
    result = []
    i = 0
    block_index = 0

    while i < len(lines):
        line = lines[i]
        stripped = line.lstrip()

        # Detect voiceover `with` line
        if stripped.startswith("with self.voiceover("):
            # Get the indentation of the `with` line
            with_indent = len(line) - len(stripped)
            body_indent = with_indent + 4  # Python indents body by 4 spaces
            duration = 3.0
            if scene_durations:
                duration = scene_durations[min(block_index, len(scene_durations) - 1)]
            duration_literal = f"{duration:.3f}"

            # Skip the full `with` header, which may span multiple lines
            while i < len(lines) and not lines[i].rstrip().endswith(":"):
                i += 1
            i += 1

            while i < len(lines):
                inner = lines[i]
                inner_stripped = inner.lstrip()
                inner_indent = len(inner) - len(inner_stripped)

                # If we hit a line with same or less indentation (and it's not blank),
                # the block is over
                if inner_stripped and inner_indent <= with_indent:
                    break

                # Dedent the body line by one level
                if inner_indent >= body_indent:
                    dedented = " " * with_indent + inner[body_indent:]
                    result.append(
                        dedented.replace("tracker.duration", duration_literal)
                    )
                elif not inner_stripped:
                    result.append("")
                else:
                    result.append(inner.replace("tracker.duration", duration_literal))
                i += 1
            block_index += 1
        else:
            result.append(line.replace("tracker.duration", "3.000"))
            i += 1

    return "\n".join(result)
