"""
Database utility functions and helpers.
"""
import logging
from datetime import datetime
from typing import Dict, List, Optional, Type, TypeVar

from beanie import Document
from database import db_manager
from pymongo.errors import DuplicateKeyError, OperationFailure

logger = logging.getLogger(__name__)

DocumentType = TypeVar("DocumentType", bound=Document)


async def check_collection_exists(collection_name: str) -> bool:
    """
    Check if a collection exists in the database.
    """
    try:
        collections = await db_manager.database.list_collection_names()
        return collection_name in collections
    except Exception as e:
        logger.error(f"Error checking collection existence: {e}")
        return False


async def get_collection_stats(collection_name: str) -> Optional[Dict]:
    """
    Get statistics for a collection.
    """
    try:
        stats = await db_manager.database.command("collStats", collection_name)
        return {
            "count": stats.get("count", 0),
            "size": stats.get("size", 0),
            "avgObjSize": stats.get("avgObjSize", 0),
            "storageSize": stats.get("storageSize", 0),
            "indexes": stats.get("nindexes", 0),
        }
    except Exception as e:
        logger.error(f"Error getting collection stats: {e}")
        return None


async def backup_collection(
    collection_name: str, backup_name: Optional[str] = None
) -> bool:
    """
    Create a backup of a collection.
    """
    try:
        if not backup_name:
            backup_name = f"{collection_name}_backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

        # Copy collection
        pipeline = [{"$out": backup_name}]
        await db_manager.database[collection_name].aggregate(pipeline).to_list(
            length=None
        )

        logger.info(f"Collection {collection_name} backed up to {backup_name}")
        return True

    except Exception as e:
        logger.error(f"Error backing up collection {collection_name}: {e}")
        return False


async def drop_collection_safely(collection_name: str, backup: bool = True) -> bool:
    """
    Safely drop a collection with optional backup.
    """
    try:
        if backup:
            success = await backup_collection(collection_name)
            if not success:
                logger.warning(
                    f"Backup failed for {collection_name}, continuing with drop..."
                )

        await db_manager.database[collection_name].drop()
        logger.info(f"Collection {collection_name} dropped successfully")
        return True

    except Exception as e:
        logger.error(f"Error dropping collection {collection_name}: {e}")
        return False


async def create_text_index(collection_name: str, fields: List[str]) -> bool:
    """
    Create a text index on specified fields.
    """
    try:
        index_spec = [(field, "text") for field in fields]
        await db_manager.database[collection_name].create_index(index_spec)
        logger.info(f"Text index created on {collection_name} for fields: {fields}")
        return True

    except DuplicateKeyError:
        logger.info(f"Text index already exists on {collection_name}")
        return True
    except Exception as e:
        logger.error(f"Error creating text index on {collection_name}: {e}")
        return False


async def optimize_collection(collection_name: str) -> bool:
    """
    Optimize a collection by rebuilding indexes and compacting.
    """
    try:
        # Reindex collection
        await db_manager.database.command("reIndex", collection_name)

        # Compact collection (MongoDB 4.4+)
        try:
            await db_manager.database.command("compact", collection_name)
        except OperationFailure:
            # Compact might not be available in all MongoDB versions
            logger.warning(f"Compact operation not available for {collection_name}")

        logger.info(f"Collection {collection_name} optimized successfully")
        return True

    except Exception as e:
        logger.error(f"Error optimizing collection {collection_name}: {e}")
        return False


async def get_database_info() -> Dict:
    """
    Get comprehensive database information.
    """
    try:
        # Database stats
        db_stats = await db_manager.database.command("dbStats")

        # Collection info
        collections = await db_manager.database.list_collection_names()
        collection_stats = {}

        for collection in collections:
            stats = await get_collection_stats(collection)
            if stats:
                collection_stats[collection] = stats

        return {
            "database_name": db_manager.database.name,
            "mongodb_version": db_stats.get("version", "unknown"),
            "data_size": db_stats.get("dataSize", 0),
            "storage_size": db_stats.get("storageSize", 0),
            "index_size": db_stats.get("indexSize", 0),
            "collections": len(collections),
            "objects": db_stats.get("objects", 0),
            "avg_obj_size": db_stats.get("avgObjSize", 0),
            "collection_details": collection_stats,
            "indexes": sum(
                stats.get("indexes", 0) for stats in collection_stats.values()
            ),
        }

    except Exception as e:
        logger.error(f"Error getting database info: {e}")
        return {"error": str(e)}


async def validate_document_schema(document: DocumentType) -> List[str]:
    """
    Validate a document against its schema and return any errors.
    """
    errors = []

    try:
        # Try to validate using Pydantic
        document.model_validate(document.model_dump())

    except Exception as e:
        errors.append(f"Schema validation error: {str(e)}")

    return errors


async def bulk_insert_with_validation(
    document_class: Type[DocumentType],
    documents: List[Dict],
    validate: bool = True,
) -> Dict[str, int]:
    """
    Bulk insert documents with optional validation.
    """
    results = {"inserted": 0, "errors": 0, "validation_errors": []}

    for doc_data in documents:
        try:
            # Create document instance
            document = document_class(**doc_data)

            # Validate if requested
            if validate:
                validation_errors = await validate_document_schema(document)
                if validation_errors:
                    results["validation_errors"].extend(validation_errors)
                    results["errors"] += 1
                    continue

            # Save document
            await document.save()
            results["inserted"] += 1

        except Exception as e:
            logger.error(f"Error inserting document: {e}")
            results["errors"] += 1

    return results
