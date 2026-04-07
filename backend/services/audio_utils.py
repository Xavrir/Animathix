from __future__ import annotations

import asyncio
import subprocess
import wave
from dataclasses import dataclass
from pathlib import Path
from tempfile import NamedTemporaryFile

TRANSITION_GAP_SECONDS = 0.2
FINAL_PAD_SECONDS = 0.2


@dataclass(slots=True)
class AudioSegment:
    path: str
    duration_seconds: float


def get_wav_duration(file_path: str) -> float:
    with wave.open(file_path, "rb") as wav_file:
        frame_rate = wav_file.getframerate()
        if frame_rate <= 0:
            raise ValueError(f"Invalid frame rate in WAV file: {file_path}")
        return wav_file.getnframes() / frame_rate


def transcode_audio_to_wav(input_path: str) -> str:
    output = NamedTemporaryFile(delete=False, suffix=".wav")
    output_path = output.name
    output.close()

    result = subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            input_path,
            "-ac",
            "1",
            "-ar",
            "44100",
            output_path,
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode != 0:
        stderr = result.stderr.decode(errors="replace")
        raise RuntimeError(stderr or "ffmpeg audio transcode failed")

    return output_path


def _write_silence_frames(
    wav_file: wave.Wave_write,
    duration_seconds: float,
    *,
    frame_rate: int,
    sample_width: int,
    channels: int,
) -> None:
    frame_count = max(int(duration_seconds * frame_rate), 0)
    if frame_count <= 0:
        return

    silence_frame = b"\x00" * sample_width * channels
    wav_file.writeframes(silence_frame * frame_count)


def build_narration_track(
    segments: list[AudioSegment],
    *,
    transition_gap_seconds: float = TRANSITION_GAP_SECONDS,
    final_pad_seconds: float = FINAL_PAD_SECONDS,
) -> str:
    if not segments:
        raise ValueError("At least one audio segment is required")

    output = NamedTemporaryFile(delete=False, suffix="_narration.wav")
    output_path = output.name
    output.close()

    with wave.open(segments[0].path, "rb") as first_segment:
        params = first_segment.getparams()
        frame_rate = first_segment.getframerate()
        sample_width = first_segment.getsampwidth()
        channels = first_segment.getnchannels()

    with wave.open(output_path, "wb") as output_wav:
        output_wav.setparams(params)

        for index, segment in enumerate(segments):
            with wave.open(segment.path, "rb") as input_wav:
                segment_signature = (
                    input_wav.getnchannels(),
                    input_wav.getsampwidth(),
                    input_wav.getframerate(),
                    input_wav.getcomptype(),
                )
                expected_signature = (
                    channels,
                    sample_width,
                    frame_rate,
                    params.comptype,
                )
                if segment_signature != expected_signature:
                    raise ValueError("Kokoro audio segments must share WAV parameters")
                output_wav.writeframes(input_wav.readframes(input_wav.getnframes()))

            if index < len(segments) - 1:
                _write_silence_frames(
                    output_wav,
                    transition_gap_seconds,
                    frame_rate=frame_rate,
                    sample_width=sample_width,
                    channels=channels,
                )

        _write_silence_frames(
            output_wav,
            final_pad_seconds,
            frame_rate=frame_rate,
            sample_width=sample_width,
            channels=channels,
        )

    return output_path


async def merge_audio_with_video(
    video_path: str,
    audio_path: str,
    *,
    output_path: str | None = None,
) -> str:
    source_path = Path(video_path)
    merged_path = (
        Path(output_path)
        if output_path
        else source_path.with_name(f"{source_path.stem}_voiced{source_path.suffix}")
    )

    process = await asyncio.create_subprocess_exec(
        "ffmpeg",
        "-y",
        "-i",
        video_path,
        "-i",
        audio_path,
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-movflags",
        "+faststart",
        str(merged_path),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    stdout_bytes, stderr_bytes = await process.communicate()
    if process.returncode != 0:
        stderr = stderr_bytes.decode(errors="replace")
        stdout = stdout_bytes.decode(errors="replace")
        raise RuntimeError(stderr or stdout or "ffmpeg audio merge failed")

    return str(merged_path.resolve())


def cleanup_audio_segments(segments: list[AudioSegment]) -> None:
    for segment in segments:
        Path(segment.path).unlink(missing_ok=True)
