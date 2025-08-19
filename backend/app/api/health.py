"""
Health check API endpoints.
"""
from datetime import datetime

from app.core.database import db_manager
from fastapi import APIRouter, status
from pydantic import BaseModel

router = APIRouter(prefix="/health", tags=["Health"])


class HealthResponse(BaseModel):
    """Health check response model."""

    status: str
    message: str
    database: str
    timestamp: str


@router.get("/", response_model=HealthResponse, status_code=status.HTTP_200_OK)
async def health_check() -> HealthResponse:
    """
    Health check endpoint with database status.

    Returns:
        HealthResponse: Current system health status
    """
    db_healthy = await db_manager.check_health()

    return HealthResponse(
        status="healthy" if db_healthy else "degraded",
        message="Book to Course Converter Backend is running",
        database="connected" if db_healthy else "disconnected",
        timestamp=datetime.utcnow().isoformat(),
    )


@router.get("/db", status_code=status.HTTP_200_OK)
async def database_health() -> dict:
    """
    Detailed database health check.

    Returns:
        dict: Database connection details
    """
    try:
        db_healthy = await db_manager.check_health()

        if db_healthy and db_manager.client:
            # Get database stats
            stats = await db_manager.database.command("dbstats")

            return {
                "status": "connected",
                "database_name": db_manager.database.name,
                "collections": stats.get("collections", 0),
                "objects": stats.get("objects", 0),
                "data_size": stats.get("dataSize", 0),
                "storage_size": stats.get("storageSize", 0),
            }
        else:
            return {"status": "disconnected", "error": "No database connection"}

    except Exception as e:
        return {"status": "error", "error": str(e)}
