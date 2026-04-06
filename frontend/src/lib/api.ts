import { API_BASE } from "./constants";

export interface Voice {
  id: string;
  name: string;
  lang: string;
  provider: string;
  available?: boolean;
  unavailable_reason?: string | null;
}

export interface JobStatus {
  job_id: string;
  status:
    | "queued"
    | "planning"
    | "synthesizing_audio"
    | "generating_code"
    | "rendering"
    | "finalizing"
    | "complete"
    | "failed";
  progress: number;
  message: string;
  error: string | null;
}

interface VoicesResponse {
  voices: Voice[];
}

interface GenerateResponse {
  job_id: string;
}

interface ErrorResponse {
  detail?: string;
  error?: string;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => null)) as T | ErrorResponse | null;

  if (!res.ok) {
    const message =
      data && typeof data === "object"
        ? ("detail" in data && typeof data.detail === "string" && data.detail) ||
          ("error" in data && typeof data.error === "string" && data.error)
        : null;

    throw new Error(message || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export async function fetchVoices(): Promise<Voice[]> {
  const res = await fetch(`${API_BASE}/api/voices`);
  const data = await parseResponse<VoicesResponse>(res);
  return data.voices;
}

export async function startGeneration(params: {
  content: string;
  contentType: string;
  voiceId: string;
  voiceProvider: string;
  quality: string;
  file?: File;
}): Promise<string> {
  const form = new FormData();
  form.append("content", params.content);
  form.append("content_type", params.contentType);
  form.append("voice_id", params.voiceId);
  form.append("voice_provider", params.voiceProvider);
  form.append("quality", params.quality);
  if (params.file) {
    form.append("file", params.file);
  }

  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    body: form,
  });
  const data = await parseResponse<GenerateResponse>(res);
  return data.job_id;
}

export async function fetchStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${API_BASE}/api/status/${jobId}`);
  return parseResponse<JobStatus>(res);
}

export function getDownloadUrl(jobId: string): string {
  return `${API_BASE}/api/download/${jobId}`;
}
