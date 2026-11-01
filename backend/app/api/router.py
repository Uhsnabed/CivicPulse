from fastapi import APIRouter

from app.api.routes import reports, reviewer, system

api_router = APIRouter()

api_router.include_router(system.router, tags=["system"])
api_router.include_router(reports.router, tags=["reports"])
api_router.include_router(reviewer.router, tags=["reviewer"])