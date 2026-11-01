# Chart-analysis proxy (reference)

A minimal Flask service that turns a chart image into overlay-ready annotations.
It wraps a vision-LLM call so the API key stays server-side. This is a
**reference implementation** and the demo doesn't call it: uploaded charts are
annotated by hand in the browser.

## Contract

```
POST /analyze
Body:  { "image": "data:image/png;base64,..." }
200:   { "plotType": "bar_chart", "annotations": [ { id, type, text, bbox, parent?, color? } ] }
```

- `type` is one of `title | axis | axis-item | legend | legend-item`.
- `bbox` is normalized 0–1 (`x1,y1` top-left, `x2,y2` bottom-right).
- `axis-item.parent` → an `axis` id; `legend-item.parent` → a `legend` id.

This is the exact shape the frontend overlay consumes (same as the bundled
example charts). The prompt lives in [`prompts/graph_details.txt`](prompts/graph_details.txt).

## Local run

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then put your real OPENAI_API_KEY in .env
ALLOWED_ORIGINS=* python main.py # http://localhost:8080
```

## Deploy to Cloud Run

```bash
cd backend
gcloud run deploy oncursor-analyze \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "OPENAI_API_KEY=sk-...,ALLOWED_ORIGINS=https://tomfluff.github.io"
```

Cloud Run is preferred over short-timeout serverless platforms because a vision
analysis call can take 15–40s.

> **Alternative — Vercel:** you can host this as a Python serverless function,
> but raise the function `maxDuration` (Hobby's short default will time out on
> slow analyses).

## Notes

- The real `OPENAI_API_KEY` is **never committed** — set it as a Cloud Run
  env var/secret. Only `.env.example` is tracked.
- Consider adding rate limiting and a captcha (e.g. Turnstile) before exposing
  this publicly, and disclose to users that images are sent to OpenAI.
