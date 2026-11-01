"""Minimal chart-analysis proxy for the On-Cursor demo.

A single POST /analyze endpoint that takes an image (data URL) and returns
overlay-ready annotations. The LLM API key stays here (server-side) — never
sent to or stored in the frontend. See llm.py for provider selection.

Deploy to Cloud Run (see README). Set ALLOWED_ORIGINS to the demo's origin.
"""

import os

from flask import Flask, jsonify, request
from flask_cors import CORS

from llm import analyze_chart_image

app = Flask(__name__)

# CORS allowlist, e.g. ALLOWED_ORIGINS="https://visual-context.github.io".
# Defaults to "*" for easy local testing — set it explicitly in production.
_origins = os.getenv("ALLOWED_ORIGINS", "*")
_origins_value = (
    "*" if _origins.strip() == "*" else [o.strip() for o in _origins.split(",")]
)
CORS(app, resources={r"/analyze": {"origins": _origins_value}})

# Reject oversized uploads (data-URL length; base64 adds ~33% overhead).
MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_BYTES", str(8 * 1024 * 1024)))

DEBUG = os.getenv("DEBUG", "false").lower() == "true"

@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/analyze")
def analyze():
    data = request.get_json(silent=True) or {}
    image = data.get("image")
    provider = data.get("provider")

    if (
        not image
        or not isinstance(image, str)
        or not image.startswith("data:image")
    ):
        return jsonify({"error": "Provide an 'image' field as a data URL."}), 400

    if provider is not None and not isinstance(provider, str):
        return jsonify({"error": "'provider' must be a string."}), 400

    if len(image) > MAX_IMAGE_BYTES * 1.4:
        return jsonify({"error": "Image too large."}), 413

    try:
        result = analyze_chart_image(image, provider)
    except Exception as e:  # noqa: BLE001 - surface a clean error to the client
        app.logger.exception("Chart analysis failed")
        return jsonify({"error": "Analysis failed.", "detail": str(e)}), 502

    return jsonify(result), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 8080)), debug=DEBUG)
