"""Static registry of available TTS voices."""

VOICES: dict[str, list[dict]] = {
    "kokoro": [
        {"id": "af_heart", "name": "Heart (Female, US)", "lang": "en-us"},
        {"id": "af_sarah", "name": "Sarah (Female, US)", "lang": "en-us"},
        {"id": "af_nicole", "name": "Nicole (Female, US)", "lang": "en-us"},
        {"id": "am_adam", "name": "Adam (Male, US)", "lang": "en-us"},
        {"id": "am_michael", "name": "Michael (Male, US)", "lang": "en-us"},
        {"id": "bf_emma", "name": "Emma (Female, UK)", "lang": "en-gb"},
        {"id": "bm_george", "name": "George (Male, UK)", "lang": "en-gb"},
    ],
    "elevenlabs": [
        {"id": "Rachel", "name": "Rachel (Female)", "lang": "en"},
        {"id": "Drew", "name": "Drew (Male)", "lang": "en"},
        {"id": "Clyde", "name": "Clyde (Male)", "lang": "en"},
        {"id": "Domi", "name": "Domi (Female)", "lang": "en"},
    ],
    "openai": [
        {"id": "alloy", "name": "Alloy (Neutral)", "lang": "en"},
        {"id": "echo", "name": "Echo (Male)", "lang": "en"},
        {"id": "fable", "name": "Fable (Storyteller)", "lang": "en"},
        {"id": "onyx", "name": "Onyx (Male, Deep)", "lang": "en"},
        {"id": "nova", "name": "Nova (Female)", "lang": "en"},
        {"id": "shimmer", "name": "Shimmer (Female)", "lang": "en"},
    ],
}


def get_all_voices() -> list[dict]:
    """Return all voices with provider info attached."""
    result = []
    for provider, voices in VOICES.items():
        for voice in voices:
            result.append({**voice, "provider": provider})
    return result
