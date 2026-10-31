from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Future modules initialise only server-side clients here. No credentials are logged.
    yield


settings = get_settings()
logger = logging.getLogger(__name__)
app = FastAPI(
    title="CivicPulse API",
    version="0.1.0",
    description="Evidence-first civic reporting API.",
    lifespan=lifespan,
)


@app.exception_handler(Exception)
async def unexpected_error(_: Request, error: Exception) -> JSONResponse:
    """Keep frontend/API failures JSON even if a dependency fails unexpectedly."""
    logger.exception("Unhandled API error", exc_info=error)
    return JSONResponse(status_code=500, content={"detail": "Unexpected server error. Check the backend terminal."})

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(api_router, prefix=settings.api_prefix)
