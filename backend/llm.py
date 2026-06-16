"""Vision-LLM chart analysis: image -> overlay-ready annotation JSON.

Output contract (consumed by the frontend overlay):
    { "plotType": "...", "annotations": [
        { "id", "type": title|axis|axis-item|legend|legend-item,
          "text", "bbox": {x1,y1,x2,y2} normalized 0..1, "parent"?, "color"? } ] }
"""

import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is not set.")

client = OpenAI(api_key=OPENAI_API_KEY)

MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1")

_PROMPT_PATH = os.path.join(os.path.dirname(__file__), "prompts", "graph_details.txt")
with open(_PROMPT_PATH, "r", encoding="utf-8") as f:
    INSTRUCTIONS = f.read().strip()


def analyze_chart_image(data_url: str) -> dict:
    """Analyze a chart image (passed as a data URL) and return the annotation
    JSON described by the prompt. Raises on an empty or invalid response."""
    response = client.responses.create(
        model=MODEL,
        instructions=INSTRUCTIONS,
        input=[
            {
                "role": "developer",
                "content": "Analyze this chart image and return the JSON:",
            },
            {
                "role": "user",
                "content": [{"type": "input_image", "image_url": data_url}],
            },
        ],
        temperature=0.2,
        max_output_tokens=8192,
        text={"format": {"type": "json_object"}},
    )

    if not response or not response.output_text:
        raise ValueError("No response generated from the model.")

    return json.loads(response.output_text.strip())
