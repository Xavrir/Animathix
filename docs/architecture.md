# Architecture

## Request flow

1. The Next.js frontend collects a text prompt or PDF upload, selected voice, and render quality.
2. `POST /api/generate` creates an in-memory job and schedules a background generation task.
3. The backend parses the input into plain text.
4. The AI pipeline asks OpenRouter for a narration plan and then for Manim code.
5. The render executor runs Manim, finds the generated MP4, and returns the output path.
6. If Kokoro is selected, the backend synthesizes narration segments in parallel and merges them into the final video after render.
7. The frontend polls `GET /api/status/{job_id}` until the job completes, then downloads the file from `GET /api/download/{job_id}`.

## Service boundaries

### Frontend

- Route components live under `frontend/src/app/`.
- Reusable UI is split into `frontend/src/components/`.
- API helpers live in `frontend/src/lib/api.ts`.

### Backend

- `backend/main.py` wires routers and CORS.
- `backend/routers/` exposes the HTTP API.
- `backend/services/ai_pipeline.py` handles planning and Manim code generation.
- `backend/services/video_composer.py` coordinates planning, rendering, retries, and audio merge.
- `backend/services/code_executor.py` shells out to Manim and locates the final video.
- `backend/jobs/store.py` tracks job status in memory.

### Shared metadata

- `shared/voice_registry.py` contains the supported voice catalog.

### Optional sidecar

- `kokoro-sidecar/` exists because Kokoro currently runs best on Python 3.12 while the main backend targets a newer Python runtime.

## Failure handling

- Planner and code generation both retry upstream LLM failures.
- If the planner fails, the backend builds a template narration plan.
- If code generation fails, the backend falls back to template Manim scenes.
- Rendering retries up to `MAX_RETRIES` with the previous error embedded into the next repair prompt.

## Current limitations

- Job state is not persistent.
- There are no automated backend assertions yet beyond smoke checks.
- Output files remain on disk until cleaned up manually.
