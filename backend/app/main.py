"""
FastAPI application factory and main entry point.
"""
import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from app.core.config import settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan context manager.
    Handles startup and shutdown events.
    """
    # Startup
    print("Starting Book to Course Converter Backend...")

    # Initialize database
    try:
        from app.core.database import init_database

        await init_database()
        print("Database initialized successfully")
    except Exception as e:
        print(f"WARNING: Failed to initialize database: {e}")
        print("API will run in degraded mode without database functionality")
        # Don't raise - allow app to start without database for development

    yield

    # Shutdown
    print("Shutting down Book to Course Converter Backend...")

    # Close database connection
    try:
        from app.core.database import close_database

        await close_database()
        print("Database connection closed")
    except Exception as e:
        print(f"Error closing database: {e}")


def _init_logging() -> None:
    level = logging.DEBUG if settings.debug else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )
    logging.getLogger("pdfplumber").setLevel(logging.WARNING)
    logging.getLogger("fitz").setLevel(logging.WARNING)


def create_app() -> FastAPI:
    """
    Create and configure FastAPI application.
    """
    # Configure logging
    _init_logging()

    app = FastAPI(
        title=settings.app_name,
        description="Transform PDF books into interactive AI-generated courses",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.debug else None,
        openapi_url="/openapi.json" if settings.debug else None,
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    from app.api.health import router as health_router
    from app.api.pdf import router as pdf_router

    app.include_router(health_router)
    app.include_router(pdf_router, prefix="/api/v1")

    @app.get("/")
    async def root():
        """Root endpoint with API information."""
        return {
            "message": "Book to Course Converter Backend",
            "version": "0.1.0",
            "docs_url": "/docs" if settings.debug else None,
            "health_check": "/health",
        }

    return app


# Create the FastAPI app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        access_log=settings.debug,
    )
