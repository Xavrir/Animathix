"""In-memory job status store. Replace with Redis/DB for production."""

import uuid

from backend.models.schemas import JobStatus

_jobs: dict[str, JobStatus] = {}


def create_job() -> str:
    job_id = uuid.uuid4().hex[:12]
    _jobs[job_id] = JobStatus(
        job_id=job_id,
        status="queued",
        progress=0.0,
        message="Job queued",
    )
    return job_id


def update_job(job_id: str, **kwargs: object) -> None:
    if job_id in _jobs:
        current = _jobs[job_id].model_dump()
        current.update(kwargs)
        _jobs[job_id] = JobStatus(**current)


def get_job(job_id: str) -> JobStatus | None:
    return _jobs.get(job_id)
