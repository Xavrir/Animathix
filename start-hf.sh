#!/usr/bin/env bash
set -euo pipefail

(
  sleep 8
  uvicorn --app-dir /app/kokoro-sidecar main:app --host 127.0.0.1 --port 9100 \
    >/tmp/kokoro-sidecar.log 2>&1
) &

exec uvicorn backend.main:app --host 0.0.0.0 --port 7860
