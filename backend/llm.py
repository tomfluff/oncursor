"""Vision-LLM chart analysis: image -> overlay-ready annotation JSON.

Output contract (consumed by the frontend overlay):
    { "plotType": "...", "annotations": [
        { "id", "type": title|axis|axis-item|legend|legend-item,
          "text", "bbox": {x1,y1,x2,y2} normalized 0..1, "parent"?, "color"? } ] }

The caller picks a provider per request (openai|gemini); LLM_PROVIDER sets
the default when none is given.
"""

import base64
import json
import os

from dotenv import load_dotenv
from google import genai
from google.genai import types
from openai import OpenAI

load_dotenv()

DEFAULT_PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()

_PROMPT_PATH = os.path.join(os.path.dirname(__file__), "prompts", "graph_details.txt")
with open(_PROMPT_PATH, "r", encoding="utf-8") as f:
    INSTRUCTIONS = f.read().strip()

_USER_TEXT = "Analyze this chart image and return the JSON:"


def _parse_data_url(data_url: str) -> tuple[str, bytes]:
    header, b64 = data_url.split(",", 1)
    mime = header.split(";")[0].removeprefix("data:")
    return mime, base64.b64decode(b64)


def _analyze_openai(data_url: str) -> dict:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set.")
    client = OpenAI(api_key=api_key)
    model = os.getenv("OPENAI_MODEL", "gpt-4.1")

    response = client.responses.create(
        model=model,
        instructions=INSTRUCTIONS,
        input=[
            {"role": "developer", "content": [{"type": "input_text", "text": _USER_TEXT}]},
            {"role": "user", "content": [{"type": "input_image", "image_url": data_url}]},
        ],
        max_output_tokens=8192,
        text={"format": {"type": "json_object"}},
    )

    if not response or not response.output_text:
        raise ValueError("No response generated from the model.")

    return json.loads(response.output_text.strip())


def _analyze_gemini(data_url: str) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set.")
    client = genai.Client(api_key=api_key)
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    mime, image_bytes = _parse_data_url(data_url)
    response = client.models.generate_content(
        model=model,
        contents=[_USER_TEXT, types.Part.from_bytes(data=image_bytes, mime_type=mime)],
        config=types.GenerateContentConfig(
            system_instruction=INSTRUCTIONS,
            response_mime_type="application/json",
            max_output_tokens=8192,
        ),
    )

    if not response or not response.text:
        raise ValueError("No response generated from the model.")

    return json.loads(response.text.strip())


_PROVIDERS = {"openai": _analyze_openai, "gemini": _analyze_gemini}


def analyze_chart_image(data_url: str, provider: str | None = None) -> dict:
    """Analyze a chart image (passed as a data URL) and return the annotation
    JSON described by the prompt. Raises on an empty or invalid response, or
    an unknown provider."""
    provider = (provider or DEFAULT_PROVIDER).lower()
    try:
        analyze = _PROVIDERS[provider]
    except KeyError:
        raise ValueError(f"Unknown provider '{provider}'. Use 'openai' or 'gemini'.")
    return analyze(data_url)
