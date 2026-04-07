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
        # Educators & narrators
        {
            "id": "Xb7hH8MSUJpSbSDYk0k2",
            "name": "Alice (Female, UK, Educator)",
            "lang": "en",
        },
        {
            "id": "XrExE9yKIg1WjnnlVkGX",
            "name": "Matilda (Female, US, Professional)",
            "lang": "en",
        },
        {
            "id": "onwK4e9ZLuTAKqWW03F9",
            "name": "Daniel (Male, UK, Broadcaster)",
            "lang": "en",
        },
        {
            "id": "hpp4J3VqNfWAUOO0d1Us",
            "name": "Bella (Female, US, Educator)",
            "lang": "en",
        },
        {
            "id": "pFZP5JQG7iQjIQuC4Bku",
            "name": "Lily (Female, UK, Narrator)",
            "lang": "en",
        },
        {
            "id": "JBFqnCBsd6RMkjVDRZzb",
            "name": "George (Male, UK, Storyteller)",
            "lang": "en",
        },
        # Conversational
        {
            "id": "EXAVITQu4vr4xnSDxMaL",
            "name": "Sarah (Female, US, Confident)",
            "lang": "en",
        },
        {"id": "cjVigY5qzO86Huf0OWal", "name": "Eric (Male, US, Smooth)", "lang": "en"},
        {"id": "nPczCjzI2devNBz1zQrb", "name": "Brian (Male, US, Deep)", "lang": "en"},
        {"id": "pqHfZKP75CvOlQylNhV4", "name": "Bill (Male, US, Wise)", "lang": "en"},
        {
            "id": "CwhRBWXzGAHq8TQ4Fs17",
            "name": "Roger (Male, US, Casual)",
            "lang": "en",
        },
        {
            "id": "IKne3meq5aSn9XLyUdCD",
            "name": "Charlie (Male, AU, Confident)",
            "lang": "en",
        },
        {
            "id": "SAz9YHcvj6GT2YYXdXww",
            "name": "River (Neutral, US, Informative)",
            "lang": "en",
        },
        {
            "id": "cgSgspJ2msm6clMCkdW9",
            "name": "Jessica (Female, US, Playful)",
            "lang": "en",
        },
        {
            "id": "iP95p4xoKVk53GoZ742B",
            "name": "Chris (Male, US, Charming)",
            "lang": "en",
        },
        {
            "id": "TX3LPaxmHKxFdv7VOQHJ",
            "name": "Liam (Male, US, Energetic)",
            "lang": "en",
        },
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
