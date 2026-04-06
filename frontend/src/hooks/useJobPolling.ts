"use client";

import useSWR from "swr";
import { fetchStatus, type JobStatus } from "@/lib/api";

export function useJobPolling(jobId: string | null) {
  const { data, error } = useSWR<JobStatus>(
    jobId ? `job-${jobId}` : null,
    () => fetchStatus(jobId!),
    {
      refreshInterval: (data) => {
        if (!data) return 2000;
        if (data.status === "complete" || data.status === "failed") return 0;
        return 2000;
      },
      revalidateOnFocus: false,
    }
  );

  return {
    job: data ?? null,
    isLoading: jobId !== null && !data && !error,
    error,
  };
}
