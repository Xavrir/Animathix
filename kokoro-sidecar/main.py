from __future__ import annotations

import io
from functools import lru_cache

import numpy as np
import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

try:
    from kokoro import KPipeline
except ImportError as exc:  # pragma: no cover - runtime dependency check
    KPipeline = None
    IMPORT_ERROR = exc
else:
    IMPORT_ERROR = None

app = FastAPI(title="Animathix Kokoro Sidecar", version="0.1.0")


class SynthesizeRequest(BaseModel):
    text: str = Field(min_length=1)
    voice_id: str = Field(min_length=1)
    lang_code: str = Field(default="a", pattern="^[ab]$")
    speed: float = Field(default=1.0, ge=0.5, le=2.0)


@lru_cache(maxsize=2)
def get_pipeline(lang_code: str):
    if KPipeline is None:
        raise RuntimeError(f"kokoro import failed: {IMPORT_ERROR}")
    return KPipeline(lang_code=lang_code)


@app.get("/health")
async def health() -> dict[str, str]:
    if KPipeline is None:
        return {"status": "error", "message": f"kokoro import failed: {IMPORT_ERROR}"}
    return {"status": "ok"}


@app.post("/synthesize")
async def synthesize(request: SynthesizeRequest) -> Response:
    if KPipeline is None:
        raise HTTPException(
            status_code=503, detail=f"kokoro import failed: {IMPORT_ERROR}"
        )

    try:
        pipeline = get_pipeline(request.lang_code)
        chunks: list[np.ndarray] = []
        for _, _, audio in pipeline(
            request.text, voice=request.voice_id, speed=request.speed
        ):
            chunks.append(audio)

        if not chunks:
            raise HTTPException(status_code=500, detail="Kokoro produced no audio")

        combined = np.concatenate(chunks)
        buffer = io.BytesIO()
        sf.write(buffer, combined, 24000, format="WAV", subtype="PCM_16")
        return Response(content=buffer.getvalue(), media_type="audio/wav")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
