# Database Design and Architecture

## Overview

The Book to Course Converter backend uses **MongoDB** with **Motor** (async driver) and **Beanie** ODM for document storage and management. The database is designed to support the transformation of PDF books into interactive, AI-generated courses with comprehensive task management.

## Database Architecture

### Technology Stack
- **Database**: MongoDB 5.0+
- **Async Driver**: Motor 3.7+
- **ODM**: Beanie 2.0+
- **Connection Pooling**: Built-in Motor pooling
- **Indexing**: Compound and text indexes for performance

### Connection Configuration
```python
# Connection pool settings
MAX_CONNECTIONS = 100
MIN_CONNECTIONS = 10
MAX_IDLE_TIME_MS = 30000  # 30 seconds
SERVER_SELECTION_TIMEOUT_MS = 5000  # 5 seconds
CONNECT_TIMEOUT_MS = 10000  # 10 seconds
SOCKET_TIMEOUT_MS = 30000  # 30 seconds
```

## Document Schemas

### 1. Books Collection (`books`)

Stores uploaded PDF books with processing status and metadata.

**Key Fields:**
- `title` (indexed): Book title
- `author` (indexed): Book author
- `file_path`: Path to uploaded PDF file
- `processing_status` (indexed): Current processing state
- `chapter_count`: Number of detected chapters
- `metadata`: Embedded document with file info
- `ai_analysis`: AI processing results

**Indexes:**
- Single field: `title`, `author`, `upload_date`, `processing_status`
- Text search: `title`, `author`, `description`

### 2. Courses Collection (`courses`)

AI-generated courses created from books.

**Key Fields:**
- `book_id` (indexed): Reference to source book
- `title` (indexed): Course title
- `total_chapters`: Number of course chapters
- `generation_status` (indexed): Course generation state
- `learning_objectives`: Array of learning goals
- `pricing`: Embedded pricing configuration
- `ai_analysis`: AI generation metadata

**Indexes:**
- Compound: `book_id + title`
- Single field: `generation_status`, `is_published`, `tags`
- Text search: `title`, `description`, `tags`

### 3. Chapters Collection (`chapters`)

Individual chapters within courses.

**Key Fields:**
- `course_id` (indexed): Reference to parent course
- `chapter_number` (indexed): Sequential order
- `content`: Embedded content document
- `learning_objectives`: Chapter-specific goals
- `price`: Individual chapter pricing
- `difficulty_level`: Beginner/Intermediate/Advanced

**Indexes:**
- Compound (unique): `course_id + chapter_number`
- Single field: `is_published`, `difficulty_level`
- Text search: `title`, `content.summary`

### 4. Tasks Collection (`tasks`)

Interactive exercises and assignments within chapters.

**Key Fields:**
- `chapter_id` (indexed): Reference to parent chapter
- `task_type` (indexed): Type of task (coding, writing, etc.)
- `sequence_number`: Order within chapter
- `instructions`: Embedded task instructions
- `validation`: Embedded validation criteria
- `difficulty_level`: Task difficulty

**Indexes:**
- Compound (unique): `chapter_id + sequence_number`
- Compound: `chapter_id + task_type`
- Single field: `difficulty_level`, `is_published`
- Text search: `learning_objectives`, `instructions.title`

## Performance Optimizations

### 1. Indexing Strategy

**Primary Indexes:**
- All foreign key references (`book_id`, `course_id`, `chapter_id`)
- Frequently queried fields (`processing_status`, `generation_status`)
- Sort fields (`upload_date`, `chapter_number`)

**Compound Indexes:**
- Unique constraints (`course_id + chapter_number`)
- Common query patterns (`book_id + title`)
- Filter combinations (`chapter_id + task_type`)

**Text Indexes:**
- Full-text search across relevant content fields
- Multi-field text search for comprehensive queries

### 2. Document Design

**Embedded Documents:**
- Related data stored together (metadata, content, instructions)
- Reduces need for joins and separate queries
- Optimized for read-heavy operations

**Reference Documents:**
- Links between main entities (book → course → chapter → task)
- Enables efficient querying and data integrity
- Supports relationship-based operations

### 3. Connection Pooling

**Pool Configuration:**
- Minimum 10 connections for baseline availability
- Maximum 100 connections for high load
- 30-second idle timeout for resource efficiency
- Automatic connection recycling

## Data Management

### 1. Migration Scripts

**Database Setup:**
```bash
# Initialize database with indexes and sample data
poetry run python scripts/db_setup.py setup

# Reset database (WARNING: Deletes all data)
poetry run python scripts/db_setup.py reset
```

**Sample Data:**
- Complete book → course → chapter → task hierarchy
- Realistic data for development and testing
- Different task types and difficulty levels

### 2. Health Monitoring

**Health Check Endpoint:**
- Database connectivity status
- Response time monitoring
- Error tracking and logging

**Collection Statistics:**
- Document counts per collection
- Index usage and performance
- Storage size and optimization metrics

### 3. Backup and Recovery

**Backup Features:**
- Collection-level backup before operations
- Timestamp-based backup naming
- Safe drop operations with automatic backup

**Recovery Process:**
- Collection restoration from backups
- Data integrity validation
- Index rebuilding after recovery

## Security Considerations

### 1. Access Control

**Connection Security:**
- MongoDB authentication (when configured)
- SSL/TLS encryption for production
- Network-level access restrictions

**Data Protection:**
- Input validation via Pydantic models
- SQL injection prevention (NoSQL)
- Sanitized error messages

### 2. Data Integrity

**Schema Validation:**
- Pydantic model validation
- Required field enforcement
- Type checking and conversion

**Referential Integrity:**
- Beanie link validation
- Cascade operations for consistency
- Foreign key reference checking

## Development Guidelines

### 1. Model Design

**Best Practices:**
- Use Beanie `Document` for main collections
- Use Pydantic `BaseModel` for embedded documents
- Implement proper field validation and defaults
- Add comprehensive docstrings

**Naming Conventions:**
- Collection names: lowercase, plural (`books`, `courses`)
- Field names: snake_case (`created_at`, `file_path`)
- Index names: descriptive and consistent

### 2. Query Optimization

**Efficient Queries:**
- Use indexes for filtering and sorting
- Limit result sets with pagination
- Project only needed fields
- Avoid complex aggregations when possible

**Async Patterns:**
- Use async/await for all database operations
- Implement proper error handling
- Use connection pooling efficiently
- Monitor connection usage

### 3. Testing Strategy

**E2E Testing:**
- Test complete data flows (book → course → chapters → tasks)
- Validate data integrity across operations
- Test performance under realistic loads
- Verify backup and recovery procedures

**Data Validation:**
- Test schema validation edge cases
- Verify index effectiveness
- Test connection pool behavior
- Validate error handling

## Monitoring and Maintenance

### 1. Performance Metrics

**Key Metrics:**
- Query response times
- Connection pool utilization
- Index hit ratios
- Document growth rates

**Monitoring Tools:**
- MongoDB Compass for visual inspection
- Built-in health check endpoints
- Application logging and metrics
- Database profiling for slow queries

### 2. Maintenance Tasks

**Regular Maintenance:**
- Index optimization and rebuilding
- Collection compaction (when needed)
- Query performance analysis
- Data consistency checks

**Scaling Considerations:**
- Horizontal scaling with sharding
- Read replicas for read-heavy operations
- Connection pool tuning for load
- Caching strategies for hot data

## Example Usage

### 1. Basic Operations

```python
from app.models import Book, Course, Chapter, Task

# Create a new book
book = await Book(
    title="Python Programming",
    author="John Doe",
    file_path="/uploads/book.pdf"
).save()

# Find books by author
books = await Book.find(Book.author == "John Doe").to_list()

# Get course with chapters
course = await Course.find_one(Course.book_id == book.id)
chapters = await Chapter.find(Chapter.course_id == course.id).sort(Chapter.chapter_number).to_list()
```

### 2. Advanced Queries

```python
# Full-text search across books
results = await Book.find({"$text": {"$search": "python programming"}}).to_list()

# Aggregate course statistics
pipeline = [
    {"$group": {"_id": "$difficulty_level", "count": {"$sum": 1}}},
    {"$sort": {"count": -1}}
]
stats = await Course.aggregate(pipeline).to_list(length=None)

# Get tasks with validation
coding_tasks = await Task.find(
    Task.task_type == TaskType.CODING,
    Task.is_published == True
).sort(Task.sequence_number).to_list()
```

This database design provides a solid foundation for the Book to Course Converter application, balancing performance, scalability, and maintainability while supporting the complex data relationships required for AI-powered course generation.
