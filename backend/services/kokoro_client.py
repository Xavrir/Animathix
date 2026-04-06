from __future__ import annotations

from dataclasses import dataclass
from tempfile import NamedTemporaryFile

import httpx

from backend.config import settings
from backend.models.schemas import ScenePlan
from backend.services.audio_utils import AudioSegment, get_wav_duration

VOICE_LANGUAGE_PREFIXES = {
    "af_": "a",
    "am_": "a",
    "bf_": "b",
    "bm_": "b",
}


class KokoroError(RuntimeError):
    pass


@dataclass(slots=True)
class ProviderAvailability:
    available: bool
    reason: str | None = None


def get_kokoro_lang_code(voice_id: str) -> str:
    for prefix, lang_code in VOICE_LANGUAGE_PREFIXES.items():
        if voice_id.startswith(prefix):
            return lang_code
    return "a"


async def get_kokoro_availability() -> ProviderAvailability:
    try:
        async with httpx.AsyncClient(timeout=settings.KOKORO_HEALTH_TIMEOUT) as client:
            response = await client.get(f"{settings.KOKORO_SIDECAR_URL}/health")
        if response.status_code != 200:
            return ProviderAvailability(False, "Kokoro sidecar is not healthy")
        payload = response.json()
        if payload.get("status") != "ok":
            return ProviderAvailability(
                False, payload.get("message") or "Kokoro sidecar unavailable"
            )
        return ProviderAvailability(True)
    except Exception as exc:  # pragma: no cover - network health check
        return ProviderAvailability(False, str(exc))


async def synthesize_kokoro_segments(
    scenes: list[ScenePlan],
    voice_id: str,
) -> list[AudioSegment]:
    availability = await get_kokoro_availability()
    if not availability.available:
        raise KokoroError(availability.reason or "Kokoro sidecar unavailable")

    segments: list[AudioSegment] = []
    lang_code = get_kokoro_lang_code(voice_id)

    async with httpx.AsyncClient(timeout=settings.KOKORO_REQUEST_TIMEOUT) as client:
        for index, scene in enumerate(scenes):
            response = await client.post(
                f"{settings.KOKORO_SIDECAR_URL}/synthesize",
                json={
                    "text": scene.narration_text,
                    "voice_id": voice_id,
                    "lang_code": lang_code,
                    "speed": 1.0,
                },
            )
            if response.status_code != 200:
                detail = response.text.strip() or "Kokoro synthesis failed"
                raise KokoroError(f"Scene {index + 1}: {detail}")

            temp_file = NamedTemporaryFile(
                delete=False, suffix=f"_scene{index + 1}.wav"
            )
            temp_file.write(response.content)
            temp_file.close()

            segments.append(
                AudioSegment(
                    path=temp_file.name,
                    duration_seconds=get_wav_duration(temp_file.name),
                )
            )

    return segments
