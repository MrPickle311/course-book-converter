# Book to Course Converter Backend

FastAPI backend for transforming PDF books into interactive AI-generated courses.

## Features

- **Advanced PDF Processing**:
  - Text extraction with structure preservation (PyMuPDF + pdfplumber)
  - Chapter detection and content classification
  - Image and table extraction with OCR support
  - Text cleaning and normalization pipeline
- **AI Integration**: OpenAI GPT-4 powered content generation
- **Course Generation**: Intelligent transformation of book content into structured courses
- **Task Management**: Multi-modal practical exercises (coding, writing, file uploads)
- **Per-Chapter Pricing**: Flexible monetization model

## Tech Stack

- **Framework**: FastAPI (Python 3.12+)
- **Database**: MongoDB with Motor (async driver) and Beanie ODM
- **PDF Processing**: PyMuPDF, pdfplumber, Tesseract OCR
- **Code Quality**: Ruff, Black, isort (optional)
- **Testing**: E2E testing only (no backend unit tests)

## Getting Started (pip + venv)

### Prerequisites
- Python 3.12+
- pip
- MongoDB (optional for degraded mode)

### Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Copy environment configuration
awk '{print}' .env > .env  # Or copy manually
```

### Run the API (no poetry)

```bash
# Development server with reload
python scripts/dev.py

# Or directly with uvicorn
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The server will be available at:
- http://127.0.0.1:8000
- Docs (debug mode): http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/health

### Degraded Mode
If MongoDB is not running, the API starts in degraded mode and returns a `degraded` status on `/health/`.

### Database (optional)
Start MongoDB locally and the API will connect automatically using env settings in `.env`.

### Scripts
- `scripts/dev.py`: run server (no poetry required)
- `scripts/db_setup.py setup`: initialize database with sample data (requires MongoDB)
- `scripts/db_setup.py reset`: reset collections (WARNING: deletes data)
- `scripts/test_schemas.py`: validate Pydantic schemas
- `scripts/test_pdf_processor.py`: validate PDF processor

## API
- `GET /` – root
- `GET /health/` – health check (includes DB status)

## Configuration
See `env.example` for environment variables. Key settings:
- `DEBUG` – enable docs/openapi in development
- `DATABASE_URL`, `DATABASE_NAME` – MongoDB connection
- `UPLOAD_DIR`, `MAX_FILE_SIZE` – uploads
- `PDF_*` – PDF processing options
- `OPENAI_*` – AI configuration (optional)

## License
This project is part of the Book to Course Converter MVP.
