import logging
from typing import Literal

from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import require_reviewer
from app.services.supabase import get_supabase_client
logger = logging.getLogger(__name__)


class ReportStatusUpdate(BaseModel):
    new_status: Literal[
        "submitted",
        "under_review",
        "routed",
        "resolved",
        "closed",
    ]
    note: str | None = Field(default=None, max_length=500)

router = APIRouter(prefix="/reviewer")


@router.get("/me", summary="Verify reviewer authentication")
def reviewer_me(
    reviewer_id: str = Depends(require_reviewer),
):
    return {
        "authenticated": True,
        "role": "reviewer",
        "user_id": reviewer_id,
    }


@router.get("/reports", summary="List genuine civic reports for reviewers")
def list_reports(
    reviewer_id: str = Depends(require_reviewer),
):
    try:
        client = get_supabase_client()

        result = (
            client.table("civic_reports")
            .select(
                "id, public_reference, status, citizen_description, "
                "language_code, ai_analysis, routing_recommendation, "
                "created_at, updated_at"
            )
            .neq("status", "draft")
            .order("created_at", desc=True)
            .limit(100)
            .execute()
        )

        return {
            "reports": result.data,
            "reviewer_id": reviewer_id,
        }

    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail="Could not retrieve civic reports."
        ) from error

@router.patch("/reports/{reference}/status")
def update_report_status(
    reference: str,
    payload: ReportStatusUpdate,
    reviewer_id: str = Depends(require_reviewer),
):
    try:
        client = get_supabase_client()

        result = client.rpc(
            "update_civic_report_status",
            {
                "p_reference": reference,
                "p_new_status": payload.new_status,
                "p_reviewer_id": reviewer_id,
                "p_note": payload.note,
            },
        ).execute()

        return {
            "success": True,
            "message": "Report status updated successfully.",
            "transition": result.data,
        }

    except Exception as error:
        error_message = str(error)

        if "REPORT_NOT_FOUND" in error_message:
            raise HTTPException(status_code=404, detail="Report not found.")

        if "STATUS_UNCHANGED" in error_message:
            raise HTTPException(status_code=409, detail="Report already has this status.")

        if "INVALID_REVIEW_STATUS" in error_message:
            raise HTTPException(status_code=422, detail="Invalid review status.")

        logger.exception("Could not update report status: %s", reference)
        raise HTTPException(
            status_code=502,
            detail="Could not update report status.",
        ) from error