import asyncio
import logging
from contextlib import suppress
from typing import Callable

from backend.config import settings
from backend.models.schemas import GenerateRequest, NarrationPlan
from backend.services.ai_pipeline import (
    generate_manim_code,
    generate_plan,
)
from backend.services.audio_utils import (
    build_narration_track,
    cleanup_audio_segments,
    merge_audio_with_video,
)
from backend.services.code_executor import render_manim_scene
from backend.services.elevenlabs_client import synthesize_elevenlabs_segments
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
    plan = await generate_plan(request.content)

    logger.info("Plan generated: %s (%d scenes)", plan.title, len(plan.scenes))

    # Step 2: Generate and render with retry loop
    video_path = await _generate_and_render(
        original_content=request.content,
        plan=plan,
        voice_id=request.voice_id,
        voice_provider=request.voice_provider,
        quality=request.quality,
        update_status=update_status,
    )

    await update_status("complete", 1.0, "Video ready!")
    return video_path


async def _generate_and_render(
    original_content: str,
    plan: NarrationPlan,
    voice_id: str,
    voice_provider: str,
    quality: str,
    update_status: Callable,
) -> str:
    """Generate Manim code and render with self-healing retry loop."""
    error_context = None
    last_result = "Unknown render failure"
    last_stderr = None
    max_retries = settings.MAX_RETRIES
    narration_task: asyncio.Task | None = None
    narration_segments = None
    merged_audio_path: str | None = None
    scene_durations = None

    if voice_provider == "kokoro":
        await update_status(
            "synthesizing_audio",
            0.2,
            "Synthesizing Kokoro narration...",
        )
        narration_task = asyncio.create_task(
            synthesize_kokoro_segments(plan.scenes, voice_id)
        )
    elif voice_provider == "elevenlabs":
        await update_status(
            "synthesizing_audio",
            0.2,
            "Synthesizing ElevenLabs narration...",
        )
        narration_task = asyncio.create_task(
            synthesize_elevenlabs_segments(plan.scenes, voice_id)
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

            code = await generate_manim_code(
                original_content,
                plan,
                error_context=error_context,
            )

            if narration_task is not None and narration_segments is None:
                narration_segments = await narration_task

            if narration_segments:
                scene_durations = [
                    segment.duration_seconds for segment in narration_segments
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
            last_stderr = stderr

            if success:
                if narration_segments:
                    provider_label = (
                        "Kokoro" if voice_provider == "kokoro" else "ElevenLabs"
                    )
                    await update_status(
                        "finalizing",
                        0.95,
                        f"Merging {provider_label} narration with the video...",
                    )
                    merged_audio_path = build_narration_track(narration_segments)
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

        # Include stderr for diagnosis
        detail = last_stderr or last_result
        if len(detail) > 500:
            detail = detail[-500:]
        raise RenderingError(
            f"Failed after {max_retries} attempts. Last error: {detail}"
        )
    finally:
        if narration_task and not narration_task.done():
            narration_task.cancel()
            with suppress(asyncio.CancelledError):
                await narration_task
        if narration_segments:
            cleanup_audio_segments(narration_segments)
        if merged_audio_path:
            from pathlib import Path

            Path(merged_audio_path).unlink(missing_ok=True)
