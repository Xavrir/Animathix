import logging
import tempfile
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from backend.jobs.store import create_job, get_job, update_job
from backend.models.schemas import GenerateRequest
from backend.services.input_parser import parse_input
from backend.services.video_composer import generate_video

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["generate"])

ContentType = Literal["text", "latex", "pdf", "image"]
VoiceProvider = Literal["kokoro", "elevenlabs", "openai"]
RenderQuality = Literal["low", "medium", "high"]

MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024
MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024


def _build_generation_request(
    *,
    parsed_content: str,
    voice_id: str,
    voice_provider: VoiceProvider,
    quality: RenderQuality,
) -> GenerateRequest:
    return GenerateRequest(
        content=parsed_content,
        content_type="text",
        voice_id=voice_id,
        voice_provider=voice_provider,
        quality=quality,
    )


async def _parse_generation_content(
    *,
    content: str,
    content_type: ContentType,
    file: UploadFile | None,
) -> str:
    if file and content_type == "pdf":
        return await _parse_uploaded_pdf(content=content, file=file)

    if file and content_type == "image":
        return await _parse_uploaded_image(content=content, file=file)

    return await parse_input(content, content_type)


async def _parse_uploaded_pdf(*, content: str, file: UploadFile) -> str:
    temp_path = _write_uploaded_file(file, allowed_kind="pdf")

    try:
        return await parse_input(content, "pdf", file_path=str(temp_path))
    finally:
        temp_path.unlink(missing_ok=True)


async def _parse_uploaded_image(*, content: str, file: UploadFile) -> str:
    temp_path = _write_uploaded_file(file, allowed_kind="image")

    try:
        return await parse_input(content, "image", file_path=str(temp_path))
    finally:
        temp_path.unlink(missing_ok=True)


def _write_uploaded_file(
    file: UploadFile, *, allowed_kind: Literal["pdf", "image"]
) -> Path:
    total_bytes = 0
    suffix = Path(file.filename or "upload").suffix.lower()
    max_bytes = MAX_PDF_SIZE_BYTES if allowed_kind == "pdf" else MAX_IMAGE_SIZE_BYTES

    if allowed_kind == "pdf":
        if suffix != ".pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    else:
        if suffix not in {".png", ".jpg", ".jpeg", ".webp", ".bmp"}:
            raise HTTPException(
                status_code=400,
                detail="Supported image formats: PNG, JPG, JPEG, WEBP, BMP.",
            )

    with tempfile.NamedTemporaryFile(
        delete=False, suffix=suffix or ".bin"
    ) as temp_file:
        temp_path = Path(temp_file.name)

        try:
            while chunk := file.file.read(1024 * 1024):
                total_bytes += len(chunk)
                if total_bytes > max_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail=(
                            "PDF uploads must be 50 MB or smaller."
                            if allowed_kind == "pdf"
                            else "Image uploads must be 20 MB or smaller."
                        ),
                    )
                temp_file.write(chunk)
        except Exception:
            temp_path.unlink(missing_ok=True)
            raise

    return temp_path


async def _run_generation(job_id: str, request: GenerateRequest) -> None:
    """Background task that runs the full video generation pipeline."""

    async def status_callback(status: str, progress: float, message: str) -> None:
        update_job(job_id, status=status, progress=progress, message=message)

    try:
        video_path = await generate_video(request, update_status=status_callback)
        update_job(
            job_id,
            status="complete",
            progress=1.0,
            message="Video ready!",
            video_path=video_path,
        )
    except Exception as exc:
        logger.exception("Generation failed for job %s", job_id)
        error_detail = str(exc).strip() or exc.__class__.__name__
        if len(error_detail) > 300:
            error_detail = error_detail[:300] + "..."
        update_job(
            job_id,
            status="failed",
            message="Generation failed",
            error=error_detail or "Unable to generate the video.",
        )


@router.post("/generate")
async def start_generation(
    background_tasks: BackgroundTasks,
    content: str = Form(...),
    content_type: ContentType = Form("text"),
    voice_id: str = Form("af_heart"),
    voice_provider: VoiceProvider = Form("kokoro"),
    quality: RenderQuality = Form("medium"),
    file: UploadFile | None = File(None),
):
    """Start a video generation job. Returns job_id immediately."""
    parsed_content = await _parse_generation_content(
        content=content,
        content_type=content_type,
        file=file,
    )

    request = _build_generation_request(
        parsed_content=parsed_content,
        voice_id=voice_id,
        voice_provider=voice_provider,
        quality=quality,
    )

    job_id = create_job()
    background_tasks.add_task(_run_generation, job_id, request)

    return {"job_id": job_id}


@router.get("/status/{job_id}")
async def get_status(job_id: str):
    """Poll job status."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job.model_dump(exclude={"video_path"})


@router.get("/download/{job_id}")
async def download_video(job_id: str):
    """Download the completed video."""
    job = get_job(job_id)
    if not job or not job.video_path:
        raise HTTPException(status_code=404, detail="Video not available")

    path = Path(job.video_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")

    return FileResponse(
        path=str(path),
        media_type="video/mp4",
        filename=f"animathix_{job_id}.mp4",
    )
