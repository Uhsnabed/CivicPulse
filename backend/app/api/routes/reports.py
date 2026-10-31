from datetime import UTC, datetime
from hashlib import sha256
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.core.config import get_settings
from app.schemas.reports import EvidenceAnalysis, EvidenceAnalysisResponse, ReportCreateResponse
from app.services.gemini import analyze_evidence
from app.services.supabase import get_supabase_client

router = APIRouter(prefix="/reports")

MAX_EVIDENCE_BYTES = 10 * 1024 * 1024
ALLOWED_MEDIA_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/m4a",
    "audio/webm",
}


def _validate_location(latitude: float | None, longitude: float | None) -> None:
    if (latitude is None) != (longitude is None):
        raise HTTPException(status_code=422, detail="Location must include both latitude and longitude.")
    if latitude is not None and not -90 <= latitude <= 90:
        raise HTTPException(status_code=422, detail="Latitude must be between -90 and 90.")
    if longitude is not None and not -180 <= longitude <= 180:
        raise HTTPException(status_code=422, detail="Longitude must be between -180 and 180.")


@router.post("/{reference}/analyze", response_model=EvidenceAnalysisResponse, summary="Analyze saved evidence once with Gemini")
def analyze_report(reference: str) -> EvidenceAnalysisResponse:
    """An explicit, cached analysis. Submitting a report never invokes Gemini."""
    try:
        client = get_supabase_client()
        result = client.table("civic_reports").select("id, public_reference, citizen_description, ai_analysis").eq("public_reference", reference).limit(1).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Report not found.")
        report = result.data[0]
        if report["ai_analysis"]:
            return EvidenceAnalysisResponse(reference=report["public_reference"], cached=True, analysis=EvidenceAnalysis.model_validate(report["ai_analysis"]))

        evidence = client.table("report_evidence").select("storage_path").eq("report_id", report["id"]).eq("evidence_type", "photo").limit(1).execute()
        image_bytes = None
        if evidence.data and evidence.data[0]["storage_path"]:
            image_bytes = client.storage.from_(get_settings().supabase_evidence_bucket).download(evidence.data[0]["storage_path"])

        analysis = analyze_evidence(report["citizen_description"], image_bytes)
        client.table("civic_reports").update({"ai_analysis": analysis.model_dump()}).eq("id", report["id"]).execute()
        client.table("report_events").insert({
            "report_id": report["id"], "event_type": "ai_evidence_analysis_completed", "actor_type": "system",
            "details": {"provider": "gemini", "model": get_settings().gemini_model, "used_photo": bool(image_bytes)},
        }).execute()
        return EvidenceAnalysisResponse(reference=report["public_reference"], cached=False, analysis=analysis)
    except HTTPException:
        raise
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail="Evidence analysis is temporarily unavailable. Please try once later.") from error


@router.post("", response_model=ReportCreateResponse, status_code=status.HTTP_201_CREATED, summary="Submit consented civic evidence")
async def create_report(
    description: str | None = Form(default=None, max_length=2000),
    language_code: str = Form(default="en", max_length=12),
    latitude: float | None = Form(default=None),
    longitude: float | None = Form(default=None),
    location_accuracy_meters: float | None = Form(default=None, ge=0),
    consent_to_process: bool = Form(default=False),
    evidence: list[UploadFile] | None = File(default=None),
) -> ReportCreateResponse:
    """Persist a genuine citizen report and private evidence; no AI call is made here."""
    cleaned_description = description.strip() if description else None
    uploads = evidence or []
    if not consent_to_process:
        raise HTTPException(status_code=422, detail="Consent is required before a report can be submitted.")
    if not cleaned_description and not uploads:
        raise HTTPException(status_code=422, detail="Add a description, photo, or audio recording.")
    _validate_location(latitude, longitude)

    try:
        client = get_supabase_client()
        created_at = datetime.now(UTC)
        report_result = client.table("civic_reports").insert({
            "status": "submitted",
            "citizen_description": cleaned_description,
            "language_code": language_code.lower(),
            "latitude": latitude,
            "longitude": longitude,
            "location_accuracy_meters": location_accuracy_meters,
            "consent_to_process": True,
            "consent_recorded_at": created_at.isoformat(),
        }).execute()
        report = report_result.data[0]
        report_id = report["id"]
        evidence_count = 0
        bucket = get_settings().supabase_evidence_bucket

        for upload in uploads:
            if upload.content_type not in ALLOWED_MEDIA_TYPES:
                raise HTTPException(status_code=415, detail=f"Unsupported evidence type: {upload.content_type or 'unknown'}.")
            contents = await upload.read(MAX_EVIDENCE_BYTES + 1)
            if len(contents) > MAX_EVIDENCE_BYTES:
                raise HTTPException(status_code=413, detail="Each photo or audio file must be 10 MB or smaller.")
            if not contents:
                raise HTTPException(status_code=422, detail="One of the uploaded evidence files was empty.")

            extension = Path(upload.filename or "evidence").suffix.lower() or ".bin"
            storage_path = f"{report_id}/{uuid4().hex}{extension}"
            client.storage.from_(bucket).upload(
                path=storage_path,
                file=contents,
                file_options={"content-type": upload.content_type, "upsert": "false"},
            )
            evidence_type = "photo" if upload.content_type.startswith("image/") else "audio"
            client.table("report_evidence").insert({
                "report_id": report_id,
                "evidence_type": evidence_type,
                "storage_path": storage_path,
                "original_filename": upload.filename,
                "media_sha256": sha256(contents).hexdigest(),
            }).execute()
            evidence_count += 1

        client.table("report_events").insert({
            "report_id": report_id,
            "event_type": "report_submitted",
            "actor_type": "citizen",
            "details": {"evidence_count": evidence_count, "has_location": latitude is not None},
        }).execute()
        return ReportCreateResponse(
            reference=report["public_reference"],
            status="submitted",
            evidence_count=evidence_count,
            created_at=report["created_at"],
        )
    except HTTPException:
        raise
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail="The report could not be saved to the live evidence service.") from error
