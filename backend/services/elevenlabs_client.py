from __future__ import annotations

from pathlib import Path
from tempfile import NamedTemporaryFile

import httpx

from backend.config import settings
from backend.models.schemas import ScenePlan
from backend.services.audio_utils import (
    AudioSegment,
    get_wav_duration,
    transcode_audio_to_wav,
)


class ElevenLabsError(RuntimeError):
    pass


async def synthesize_elevenlabs_segments(
    scenes: list[ScenePlan],
    voice_id: str,
) -> list[AudioSegment]:
    if not settings.ELEVENLABS_API_KEY:
        raise ElevenLabsError("ELEVENLABS_API_KEY is not configured")

    segments: list[AudioSegment] = []

    async with httpx.AsyncClient(timeout=settings.ELEVENLABS_REQUEST_TIMEOUT) as client:
        for index, scene in enumerate(scenes):
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                params={"output_format": settings.ELEVENLABS_OUTPUT_FORMAT},
                headers={
                    "xi-api-key": settings.ELEVENLABS_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "text": scene.narration_text,
                    "model_id": settings.ELEVENLABS_MODEL_ID,
                },
            )
            if response.status_code != 200:
                detail = response.text.strip() or "ElevenLabs synthesis failed"
                raise ElevenLabsError(f"Scene {index + 1}: {detail}")

            temp_mp3 = NamedTemporaryFile(delete=False, suffix=f"_scene{index + 1}.mp3")
            temp_mp3.write(response.content)
            temp_mp3.close()

            wav_path = transcode_audio_to_wav(temp_mp3.name)
            Path(temp_mp3.name).unlink(missing_ok=True)
            segments.append(
                AudioSegment(
                    path=wav_path,
                    duration_seconds=get_wav_duration(wav_path),
                )
            )

    return segments
