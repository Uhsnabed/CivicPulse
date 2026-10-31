from io import BytesIO

from google import genai
from google.genai import types
from PIL import Image

from app.core.config import get_settings
from app.schemas.reports import EvidenceAnalysis


ANALYSIS_INSTRUCTIONS = """You are CivicPulse's evidence summarizer. Analyze only the supplied citizen description and attached image, if present. Do not identify people, infer protected attributes, or claim an issue is verified. Confidence means how well the supplied material supports your summary, not whether the incident is true. If evidence is weak, use insufficient_evidence, low severity, and state what is missing. Do not name a government department. Keep every list item short and factual. Return the required JSON only."""


def _downscale_image(image_bytes: bytes) -> bytes:
    """Keep visual input useful but inexpensive for the single explicit AI call."""
    with Image.open(BytesIO(image_bytes)) as image:
        image = image.convert("RGB")
        image.thumbnail((768, 768))
        buffer = BytesIO()
        image.save(buffer, format="JPEG", quality=72, optimize=True)
        return buffer.getvalue()


def analyze_evidence(description: str | None, image_bytes: bytes | None) -> EvidenceAnalysis:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured on the server.")

    contents: list[object] = [f"Citizen description: {description or '[No written description provided]'}"]
    if image_bytes:
        contents.append(types.Part.from_bytes(data=_downscale_image(image_bytes), mime_type="image/jpeg"))

    client = genai.Client(api_key=settings.gemini_api_key)
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=ANALYSIS_INSTRUCTIONS,
            response_mime_type="application/json",
            response_schema=EvidenceAnalysis,
            temperature=0.1,
            max_output_tokens=300,
        ),
    )
    if not response.text:
        raise RuntimeError("Gemini returned no analysis.")
    return EvidenceAnalysis.model_validate_json(response.text)
