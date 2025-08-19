"""
Database configuration and connection management for MongoDB.
"""
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

from app.core.config import settings
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, OperationFailure

logger = logging.getLogger(__name__)


class DatabaseManager:
    """
    Database connection manager for MongoDB with Motor.
    """

    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.database = None

    async def connect(self) -> None:
        """
        Create database connection with connection pooling.
        """
        try:
            # Create MongoDB client with connection pooling
            self.client = AsyncIOMotorClient(
                settings.database_url,
                maxPoolSize=settings.db_max_connections,
                minPoolSize=settings.db_min_connections,
                maxIdleTimeMS=settings.db_max_idle_time_ms,
                serverSelectionTimeoutMS=settings.db_server_selection_timeout_ms,
                connectTimeoutMS=settings.db_connect_timeout_ms,
                socketTimeoutMS=settings.db_socket_timeout_ms,
                retryWrites=True,
                retryReads=True,
            )

            # Get database
            self.database = self.client[settings.database_name]

            # Test the connection
            await self.client.admin.command("ping")
            logger.info(
                f"Successfully connected to MongoDB database: {settings.database_name}"
            )

            # Initialize Beanie ODM
            await self._init_beanie()

        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during database connection: {e}")
            raise

    async def disconnect(self) -> None:
        """
        Close database connection.
        """
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")

    async def _init_beanie(self) -> None:
        """
        Initialize Beanie ODM with document models.
        """
        # Import document models
        from app.models.book import Book
        from app.models.chapter import Chapter
        from app.models.course import Course
        from app.models.task import Task

        # Initialize Beanie
        await init_beanie(
            database=self.database,
            document_models=[
                Book,
                Course,
                Chapter,
                Task,
            ],
        )
        logger.info("Beanie ODM initialized successfully")

    async def create_indexes(self) -> None:
        """
        Create database indexes for performance optimization.
        """
        try:
            # Book indexes
            await self.database.books.create_index([("title", 1)])
            await self.database.books.create_index([("author", 1)])
            await self.database.books.create_index(
                [("upload_date", -1)]
            )  # Descending for recent first
            await self.database.books.create_index([("processing_status", 1)])

            # Text search index for books
            await self.database.books.create_index(
                [("title", "text"), ("author", "text"), ("description", "text")]
            )

            # Course indexes
            await self.database.courses.create_index([("book_id", 1)])
            await self.database.courses.create_index([("title", 1)])
            await self.database.courses.create_index([("generation_status", 1)])
            await self.database.courses.create_index([("is_published", 1)])
            await self.database.courses.create_index([("book_id", 1), ("title", 1)])

            # Text search index for courses
            await self.database.courses.create_index(
                [("title", "text"), ("description", "text"), ("tags", "text")]
            )

            # Chapter indexes
            await self.database.chapters.create_index([("course_id", 1)])
            await self.database.chapters.create_index([("chapter_number", 1)])
            await self.database.chapters.create_index(
                [("course_id", 1), ("chapter_number", 1)], unique=True
            )
            await self.database.chapters.create_index([("is_published", 1)])
            await self.database.chapters.create_index([("difficulty_level", 1)])

            # Text search index for chapters
            await self.database.chapters.create_index(
                [("title", "text"), ("content.summary", "text")]
            )

            # Task indexes
            await self.database.tasks.create_index([("chapter_id", 1)])
            await self.database.tasks.create_index([("task_type", 1)])
            await self.database.tasks.create_index(
                [("chapter_id", 1), ("sequence_number", 1)], unique=True
            )
            await self.database.tasks.create_index(
                [("chapter_id", 1), ("task_type", 1)]
            )
            await self.database.tasks.create_index([("difficulty_level", 1)])
            await self.database.tasks.create_index([("is_published", 1)])

            # Text search index for tasks
            await self.database.tasks.create_index(
                [("learning_objectives", "text"), ("instructions.title", "text")]
            )

            logger.info("Database indexes created successfully")

        except OperationFailure as e:
            logger.error(f"Failed to create database indexes: {e}")
            raise

    async def check_health(self) -> bool:
        """
        Check database connection health.
        """
        try:
            if not self.client:
                return False

            await self.client.admin.command("ping")
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False


# Global database manager instance
db_manager = DatabaseManager()


@asynccontextmanager
async def get_database() -> AsyncGenerator[AsyncIOMotorClient, None]:
    """
    Dependency for getting database connection.
    """
    yield db_manager.database


async def init_database() -> None:
    """
    Initialize database connection and setup.
    """
    await db_manager.connect()
    await db_manager.create_indexes()


async def close_database() -> None:
    """
    Close database connection.
    """
    await db_manager.disconnect()
