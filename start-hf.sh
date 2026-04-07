#!/usr/bin/env bash
set -euo pipefail

uvicorn --app-dir /app/kokoro-sidecar main:app --host 127.0.0.1 --port 9100 &
KOKORO_PID=$!

cleanup() {
  kill "$KOKORO_PID" 2>/dev/null || true
}

trap cleanup EXIT

exec uvicorn backend.main:app --host 0.0.0.0 --port 7860
