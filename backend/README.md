# Book to Course Converter Backend

FastAPI backend for transforming PDF books into interactive AI-generated courses.

## Features

- **PDF Processing**: Advanced text extraction and structure analysis
- **AI Integration**: OpenAI GPT-4 powered content generation
- **Course Generation**: Intelligent transformation of book content into structured courses
- **Task Management**: Multi-modal practical exercises (coding, writing, file uploads)
- **Per-Chapter Pricing**: Flexible monetization model

## Tech Stack

- **Framework**: FastAPI with Python 3.12+
- **Database**: MongoDB with Motor (async driver)
- **Dependency Management**: Poetry
- **Code Quality**: Ruff, Black, isort
- **Testing**: E2E testing only (no backend unit tests)

## Project Structure

```
backend/
├── app/
│   ├── api/          # API routes and endpoints
│   ├── core/         # Core configuration and utilities
│   ├── models/       # Database models
│   ├── services/     # Business logic services
│   └── main.py       # FastAPI application entry point
├── docs/             # Documentation
├── scripts/          # Utility scripts
├── pyproject.toml    # Poetry configuration
└── README.md         # This file
```

## Testing Strategy

Following the API-First development approach:
- **No Backend Unit Tests**: Backend does not contain its own tests
- **E2E Testing Only**: All testing is done via end-to-end tests in a separate project
- **Full Stack Testing**: Tests run against complete backend + frontend system
- **Real User Scenarios**: Focus on actual user workflows and API contract validation

## Setup

1. **Install Poetry** (if not already installed):
   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

2. **Install dependencies**:
   ```bash
   poetry install
   ```

3. **Copy environment configuration**:
   ```bash
   cp env.example .env
   ```
   Edit `.env` with your configuration values.

4. **Run the development server**:
   ```bash
   poetry run python app/main.py
   ```
   Or with uvicorn:
   ```bash
   poetry run uvicorn app.main:app --reload
   ```

## Development

### Code Quality

Run code formatting and linting:

```bash
# Format code
poetry run black app/ scripts/
poetry run isort app/ scripts/

# Lint code
poetry run ruff check app/ scripts/
```



## API Documentation

When running in debug mode, API documentation is available at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Variables

See `env.example` for all available configuration options.

Key variables:
- `DEBUG`: Enable debug mode and API docs
- `DATABASE_URL`: MongoDB connection string
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `UPLOAD_DIR`: Directory for uploaded files

## License

This project is part of the Book to Course Converter MVP.
