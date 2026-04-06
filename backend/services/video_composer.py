import asyncio
import logging
from contextlib import suppress
from typing import Callable

from backend.config import settings
from backend.models.schemas import GenerateRequest, NarrationPlan
from backend.services.ai_pipeline import (
    generate_fallback_manim_code,
    generate_fallback_plan,
    generate_manim_code,
    generate_plan,
)
from backend.services.audio_utils import (
    build_narration_track,
    cleanup_audio_segments,
    merge_audio_with_video,
)
from backend.services.code_executor import render_manim_scene
from backend.services.kokoro_client import synthesize_kokoro_segments
from backend.services.tts_service import inject_speech_service

logger = logging.getLogger(__name__)

QUALITY_MAP = {"low": "low", "medium": "medium", "high": "high"}


class RenderingError(Exception):
    pass


async def generate_video(
    request: GenerateRequest,
    update_status: Callable,
) -> str:
    """
    Full pipeline: input -> plan -> code -> render -> video path.

    The update_status callback takes (status, progress, message).
    """
    # Step 1: Generate narration plan
    await update_status("planning", 0.1, "Analyzing your math question...")
    try:
        plan = await generate_plan(request.content)
    except Exception as exc:
        logger.warning("Falling back to template narration plan: %s", exc)
        plan = generate_fallback_plan(request.content)

    logger.info("Plan generated: %s (%d scenes)", plan.title, len(plan.scenes))

    # Step 2: Generate and render with retry loop
    video_path = await _generate_and_render(
        plan=plan,
        voice_id=request.voice_id,
        voice_provider=request.voice_provider,
        quality=request.quality,
        update_status=update_status,
    )

    await update_status("complete", 1.0, "Video ready!")
    return video_path


async def _generate_and_render(
    plan: NarrationPlan,
    voice_id: str,
    voice_provider: str,
    quality: str,
    update_status: Callable,
) -> str:
    """Generate Manim code and render with self-healing retry loop."""
    error_context = None
    last_result = "Unknown render failure"
    max_retries = settings.MAX_RETRIES
    kokoro_task: asyncio.Task | None = None
    kokoro_segments = None
    merged_audio_path: str | None = None

    if voice_provider == "kokoro":
        await update_status(
            "synthesizing_audio",
            0.2,
            "Synthesizing Kokoro narration...",
        )
        kokoro_task = asyncio.create_task(
            synthesize_kokoro_segments(plan.scenes, voice_id)
        )

    try:
        for attempt in range(max_retries):
            # Scale progress from 0.3 to 0.9 across retries
            progress_base = 0.3 + (attempt / max(max_retries - 1, 1)) * 0.5

            if attempt > 0:
                await update_status(
                    "generating_code",
                    progress_base,
                    f"Fixing code (attempt {attempt + 1}/{max_retries})...",
                )
            else:
                await update_status(
                    "generating_code",
                    0.35,
                    "Generating animation code...",
                )

            try:
                code = await generate_manim_code(plan, error_context=error_context)
            except Exception as exc:
                logger.warning("Falling back to template Manim code: %s", exc)
                code = generate_fallback_manim_code(plan)

            if kokoro_task is not None and kokoro_segments is None:
                kokoro_segments = await kokoro_task

            scene_durations = None
            if kokoro_segments:
                scene_durations = [
                    segment.duration_seconds for segment in kokoro_segments
                ]

            code = inject_speech_service(
                code,
                voice_id,
                voice_provider,
                scene_durations=scene_durations,
            )

            await update_status(
                "rendering",
                min(progress_base + 0.15, 0.9),
                f"Rendering video{f' (attempt {attempt + 1})' if attempt > 0 else ''}...",
            )

            success, result, stderr = await render_manim_scene(
                code=code,
                quality=quality,
            )
            last_result = result

            if success:
                if kokoro_segments:
                    await update_status(
                        "finalizing",
                        0.95,
                        "Merging Kokoro narration with the video...",
                    )
                    merged_audio_path = build_narration_track(kokoro_segments)
                    return await merge_audio_with_video(result, merged_audio_path)
                return result

            logger.warning(
                "Render attempt %d/%d failed: %s",
                attempt + 1,
                max_retries,
                result,
            )
            error_context = (
                f"Attempt {attempt + 1} failed.\n"
                f"Code:\n{code}\n\n"
                f"Error:\n{stderr or result}"
            )

        raise RenderingError(
            f"Failed after {max_retries} attempts. Last error: {last_result}"
        )
    finally:
        if kokoro_task and not kokoro_task.done():
            kokoro_task.cancel()
            with suppress(asyncio.CancelledError):
                await kokoro_task
        if kokoro_segments:
            cleanup_audio_segments(kokoro_segments)
        if merged_audio_path:
            from pathlib import Path

            Path(merged_audio_path).unlink(missing_ok=True)
