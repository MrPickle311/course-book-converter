# Backend Kotlin (Spring Boot, JDK 21)

This module mirrors the FastAPI backend functionality in Kotlin using Spring Boot 3 (JDK 21).

## Requirements
- JDK 21
- Maven 3.9+
- MongoDB (optional; health endpoints use it if available)
- OpenAI API key for AI ToC extraction

## Run
```bash
cd backend-kotlin
export OPENAI_API_KEY=sk-... # required for AI ToC
mvn spring-boot:run
```

## Build
```bash
mvn clean package
```

## Endpoints
- `GET /` — metadata
- `GET /health/` — returns service and DB status
- `GET /health/db` — returns DB stats or error
- `POST /api/v1/pdf/process` — multipart upload with field name `file` (PDF only)

## AI-based Table of Contents
- Uses Spring AI (OpenAI) with model `chatgpt-5`.
- Sends first 10 pages of the PDF text to AI and receives hierarchical JSON with `complete` flag.
- If `complete=false`, sends 3 more pages iteratively until complete or end-of-document.
- Converts JSON to response ToC; falls back to heuristic if AI is not available or fails.

Configure via `application.yml`:
```yaml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY:}
      chat:
        options:
          model: chatgpt-5
```

## Notes
- PDF processing uses PDFBox for text extraction and simple heading heuristics.
- Image/table extraction is not implemented in this port; fields remain for parity.
- CORS origins configured via `application.yml` under `app.allowed-origins`.
