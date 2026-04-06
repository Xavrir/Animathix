from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class ScenePlan(BaseModel):
    scene_number: int
    narration_text: str
    visual_description: str
    manim_hints: list[str]


class NarrationPlan(BaseModel):
    title: str
    concept_summary: str
    prerequisite_concepts: list[str]
    scenes: list[ScenePlan]


class GenerateRequest(BaseModel):
    content: str
    content_type: Literal["text", "latex"] = "text"
    voice_id: str = "af_heart"
    voice_provider: Literal["kokoro", "elevenlabs", "openai"] = "kokoro"
    quality: Literal["low", "medium", "high"] = "medium"


class JobStatus(BaseModel):
    job_id: str
    status: Literal[
        "queued",
        "planning",
        "synthesizing_audio",
        "generating_code",
        "rendering",
        "finalizing",
        "complete",
        "failed",
    ]
    progress: float = 0.0
    message: str = ""
    video_path: str | None = None
    error: str | None = None


class VoiceInfo(BaseModel):
    id: str
    name: str
    lang: str
    provider: str
    available: bool = True
    unavailable_reason: str | None = None
