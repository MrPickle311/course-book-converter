## Book–Course Converter — LLM Guide

This project turns uploaded PDF books into study courses with MDX notes and interactive tasks. It follows an API‑First workflow with OpenAPI as the single source of truth. Use this guide when operating as an LLM in this repo.

### Architecture Overview
- Backend: Kotlin + Spring Boot (module: `backend-kotlin/`)
- Frontend: React + TypeScript + Vite (module: `frontend/`)
- API Spec: OpenAPI 3 in `api-spec/openapi/spec.yaml`
- Storage: Uploaded PDFs and generated assets under `uploads/`

### API‑First Workflow
1) Update API spec in `api-spec/openapi/spec.yaml` for any contract change.
2) Backend server interfaces are generated during backend build (OpenAPI Generator Maven plugin).
3) Frontend client and models are generated with `npm run gen:openapi` in `frontend/`.
4) Implement backend service logic and wire controllers to the service layer.
5) Frontend must import and use generated OpenAPI types and client.

Important: Do NOT hand‑edit generated code. For backend, generated sources live under `backend-kotlin/target/generated-sources/openapi/`. For frontend, generated client lives under `frontend/src/openapi/`.

### Key Domain Types (OpenAPI)
- `Chapter` (flat representation of a course’s chapter)
  - `chapterId`, `title`, `startPage`, `endPage`, `isGenerated`
  - `progressData? { tasksCount, tasksCompleted, tasksFailed }`
- `BookDetail` (`id`, `title`, `uploadDate`, `chapters: Chapter[]`)

Chapters have exactly two UI states:
- isGenerated=false: chapter has no generated course → show “Generate course” UI.
- isGenerated=true: chapter preview reflects generated course; `progressData` is non‑null.

### Backend Endpoints (Spring Boot)
- POST `/api/v1/pdf/process` (multipart) → Process uploaded PDF; returns uploadId + chapters.
- GET `/api/v1/books` → Paginated list of books.
- GET `/api/v1/books/{uploadId}` → BookDetail (includes `chapters`).
- DELETE `/api/v1/books/{uploadId}` → Delete book + file.
- POST `/api/v1/course/generate` → Generate course (notes/tasks) from a chapter.
- GET `/api/v1/books/{uploadId}/chapters/{chapterId}/notes` → Returns MDX as `text/markdown`.
- GET `/api/v1/books/{uploadId}/chapters/{chapterId}/images/{filename}` → Returns image bytes.
- POST `/api/v1/tasks/{taskId}/submit` → Submit task answer (non‑file).
- POST `/api/v1/tasks/{taskId}/upload` → Submit task file upload.

Implementation notes:
- Controller: `backend-kotlin/src/main/kotlin/com/bcc/backend/controller/PdfController.kt`
- Services: `PdfProcessor`, `CourseGeneratorService` (generates MDX notes and tasks)
- Persistence models (e.g., `Book`, `ChapterContent`) are in `backend-kotlin/src/main/kotlin/com/bcc/backend/persistence/`
- Generated images are placed in `uploads/notes/{uploadId}/{chapterId}/` and served via the images endpoint above.

### Frontend Notes
- Generated client + models: `frontend/src/openapi/`
- Main app: `frontend/src/App.tsx`
- Book view: `frontend/src/components/BookDetail.tsx` (operates on OpenAPI `Chapter`) 
- Course view: `frontend/src/components/CourseContent.tsx` (renders MDX notes)

MDX Rendering:
- The backend returns raw MDX (string). Frontend compiles it to a React component (using `@mdx-js/mdx` + `react/jsx-runtime`) and renders under an `MDXProvider`.
- Image links in MDX must use the images endpoint, e.g.:
  `/api/v1/books/{uploadId}/chapters/{chapterId}/images/figure-1-1.png`

### Critical Do / Don’t for LLMs
- DO: Update `api-spec/openapi/spec.yaml` first when changing contracts.
- DO: Regenerate clients/servers after spec changes.
- DO: Use OpenAPI types in the frontend; avoid duplicate interfaces.
- DO: Keep UI elements (divs and structure) intact unless explicitly asked to change layout.
- DON’T: Edit generated files in `frontend/src/openapi` or `backend-kotlin/target/generated-sources/openapi`.
- DON’T: Change git state (commits/branches) — handled by user.

### E2E Testing Playbook (Playwright)
- Tests live under `e2e/tests/` and must interact with the app strictly via the UI (no direct backend calls from tests).
- Login helper: Click "Sign in with Google (Demo)" and wait for "My books" to show.
- Uploading: tests commonly upload a uniquely named copy of the PDF (e.g., `uploadId-timestamp.pdf`) to avoid collisions with existing books.
- Opening a generated course:
  - Click "Generate course" on a chapter card.
  - Locate and click the generated row. A robust selector is a text filter that matches:
    `^<ChapterTitle>In ProgressCreated <MM/DD/YYYY><X/Y> tasks\d+%$` (see `generate-course.spec.ts`).
  - Alternatively, filter for a container that has the chapter heading and no "Generate course" button.
- Tasks interactions: prefer role‑based selectors (buttons, tabs, headings). Assert progress UI:
  - Tabs: "Study Notes", "Practice Tasks (X/Y)"
  - "Progress Overview" with completed counters
- Cleanup: tests should delete the created book via the UI at the end.

Selector guidelines
- Favor `getByRole` and strict text anchors over brittle CSS classes.
- Where multiple identical chapter titles exist (e.g., multiple "Introduction" entries), scope actions to the element you just interacted with (the chapter card used for generation) or use the generated card selector described above.

Troubleshooting UI duplication
- If a chapter appears duplicated after generation, ensure the optimistic flip and the follow‑up `getBookById` refetch both run.
- The book detail list should render with a stable React `key` (chapterId) so reordering/rerendering does not create phantom duplicates.

### Build & Run
- Backend:
  - Build: `mvn -f backend-kotlin/pom.xml -DskipTests clean package`
  - Run: `mvn -f backend-kotlin/pom.xml spring-boot:run`
- Frontend:
  - Install: `npm install` (in `frontend/`)
  - Generate client: `npm run gen:openapi`
  - Dev server: `npm run dev`

### Common Pitfalls
- Editing generated client/server instead of the OpenAPI spec.
- Expecting JSON for notes; `notes` endpoint returns `text/markdown`.
- Image URLs in MDX must match the images endpoint; ensure filenames exist and are non‑empty.
- Frontend must set Accept headers to allow text (the app sets `OpenAPI.HEADERS.Accept` accordingly).

### Repository Layout (partial)
```
book-course-converter/
├─ api-spec/openapi/spec.yaml            # OpenAPI source of truth
├─ backend-kotlin/                       # Spring Boot backend
│  └─ src/main/kotlin/com/bcc/backend/
│     ├─ controller/PdfController.kt
│     ├─ service/
│     └─ persistence/
├─ frontend/                             # React + TS frontend
│  ├─ src/openapi/                       # generated client & models
│  └─ src/components/
└─ uploads/                              # PDFs and generated notes/images
```

This guide is meant to keep changes consistent with the project’s API‑First approach and prevent accidental edits to generated artifacts.


