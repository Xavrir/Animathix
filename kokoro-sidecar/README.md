# Kokoro Sidecar

This sidecar runs real Kokoro TTS on a separate Python runtime so the main
Animathix backend can stay on Python 3.14.

## Recommended setup

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 9100
```

## Endpoints

- `GET /health`
- `POST /synthesize`

Example request:

```json
{
  "text": "A derivative measures instantaneous rate of change.",
  "voice_id": "af_heart",
  "lang_code": "a",
  "speed": 1.0
}
```
