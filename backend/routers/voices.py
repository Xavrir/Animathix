from fastapi import APIRouter

from shared.voice_registry import get_all_voices
from backend.services.tts_service import get_provider_availability

router = APIRouter(prefix="/api", tags=["voices"])


@router.get("/voices")
async def list_voices():
    provider_availability = await get_provider_availability()
    voices = []
    for voice in get_all_voices():
        availability = provider_availability.get(voice["provider"], {})
        voices.append({**voice, **availability})
    return {"voices": voices}
