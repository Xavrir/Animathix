# Animathix

Animathix turns a math prompt or PDF into a narrated explainer video. The app combines a Next.js frontend, a FastAPI orchestration backend, Manim rendering, and optional Kokoro text-to-speech.

## What is included

- `frontend/` - Next.js app for the landing page, login flow, and video creation UI.
- `backend/` - FastAPI API that plans the explanation, generates Manim code, renders the scene, and serves job status.
- `shared/` - shared voice registry metadata.
- `kokoro-sidecar/` - optional Python 3.12 service for Kokoro TTS.
- `docs/architecture.md` - request flow and service boundaries.

## Local setup

## Prerequisites

- Python 3.10+
- Node.js 20+
- Manim system dependencies, including `ffmpeg`, cairo, and pango
- LaTeX is optional because the fallback scenes use plain `Text`, but some custom Manim output may still benefit from a full TeX install

### 1. Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Recommended environment variable for AI-generated plans and code:

- `OPENROUTER_API_KEY`

Optional providers:

- `ELEVENLABS_API_KEY`
- `OPENAI_API_KEY`
- `LLM_MODEL` can be swapped for another OpenRouter model slug

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:8000`. Override it with `NEXT_PUBLIC_API_URL` if needed.

### 3. Optional Kokoro sidecar

If you want Kokoro voice synthesis, start the sidecar from `kokoro-sidecar/` using the instructions in `kokoro-sidecar/README.md`.

## API overview

- `GET /api/health` - health check.
- `GET /api/voices` - available voices and provider readiness.
- `POST /api/generate` - start a generation job from text or PDF input.
- `GET /api/status/{job_id}` - poll generation progress.
- `GET /api/download/{job_id}` - download the rendered MP4.

## Development notes

- Generated media lives under `media/` and is git-ignored.
- The job store is currently in-memory, so restarting the backend clears active jobs.
- The backend falls back to template narration plans and template Manim code if upstream generation fails.

## Validation

- Backend smoke check: `python -m compileall backend shared`
- Backend tests: `python -m pytest`
- Frontend lint: `cd frontend && npm run lint`
- Frontend production build: `cd frontend && npm run build`
