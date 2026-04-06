from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OPENROUTER_API_KEY: str = ""
    ELEVENLABS_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    LLM_MODEL: str = "qwen/qwen3.6-plus:free"
    MANIM_QUALITY: str = "medium_quality"
    MEDIA_DIR: str = "./media"
    MAX_RETRIES: int = 5
    RENDER_TIMEOUT: int = 300  # seconds
    KOKORO_SIDECAR_URL: str = "http://127.0.0.1:9100"
    KOKORO_HEALTH_TIMEOUT: float = 2.0
    KOKORO_REQUEST_TIMEOUT: float = 45.0

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
