from datetime import UTC, datetime

from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.system import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, summary="Check API availability")
async def health_check() -> HealthResponse:
    """A dependency-free endpoint suitable for local and hosted health checks."""
    settings = get_settings()
    return HealthResponse(
        status="ok",
        environment=settings.app_env,
        timestamp=datetime.now(UTC),
    )
