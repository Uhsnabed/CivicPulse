from fastapi import APIRouter

from app.api.routes import reports, system

api_router = APIRouter()
api_router.include_router(system.router, tags=["system"])
api_router.include_router(reports.router, tags=["reports"])
