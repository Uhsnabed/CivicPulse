from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ReportCreateResponse(BaseModel):
    reference: str
    status: Literal["submitted"]
    evidence_count: int
    created_at: datetime


class EvidenceAnalysis(BaseModel):
    """Constrained AI output: evidence support, not a claim of incident truth."""

    issue_category: Literal["electrical", "road_damage", "water_leak", "waste", "streetlight", "flooding", "air_quality", "other", "insufficient_evidence"]
    severity: Literal["low", "medium", "high", "urgent"]
    summary: str = Field(max_length=240)
    visible_evidence: list[str] = Field(default_factory=list, max_length=4)
    missing_evidence: list[str] = Field(default_factory=list, max_length=3)
    confidence: float = Field(ge=0, le=1)
    routing_category: str = Field(max_length=80)
    safety_note: str = Field(max_length=180)


class EvidenceAnalysisResponse(BaseModel):
    reference: str
    cached: bool
    analysis: EvidenceAnalysis


class PublicSignal(BaseModel):
    reference: str
    submitted_at: datetime
    status: str
    issue_category: str
    severity: str
    summary: str
    routing_category: str
    area_hint: str


class ReportTimelineEvent(BaseModel):
    event_type: str
    created_at: datetime


class ReportTimelineResponse(BaseModel):
    reference: str
    status: str
    events: list[ReportTimelineEvent]
