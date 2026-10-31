from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class ReportCreateResponse(BaseModel):
    reference: str
    status: Literal["submitted"]
    evidence_count: int
    created_at: datetime
