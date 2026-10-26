# Cognexa

> **Understand the connections.**

Cognexa is a full-stack HackFest 2.0 app that turns a photo of a textbook page into
visual revision material: an **interactive mind map**, a **concise summary** with key terms,
and a **revision quiz** with instant scoring and explanations.

**AI integration:** the backend calls **Gemma 4** (`gemma-4-31b-it`) through **Google AI
Studio** using the official `google-genai` SDK. The model reads the uploaded page image and
returns the topic, subtopics, concepts, summary, key terms and quiz questions. The API key
lives only on the backend (`GOOGLE_API_KEY`); it is never exposed to the frontend.

Results are labelled honestly: live results carry `is_demo: false`, `generator: "gemma4"` and a
**GEMMA 4 · AI-GENERATED** badge, while the optional offline mock provider still produces
clearly-labelled **DEMO DATA** results. Only Gemma 4 is ever called — there is no fallback
model and no silent switching.

---

## Features

- **Landing page** — hero, mind-map preview, Upload → Visualize → Revise explainer, feature
  sections and project footer. Copy adapts to the active provider (Gemma 4 or mock).
- **Workspace** — drag & drop or file-picker upload (PNG/JPG/JPEG, ≤ 10 MB), instant preview,
  filename + dimensions + size, replace/remove controls, client-side validation messages, and a
  clear primary *Generate Mind Map* action.
- **Processing screen** — staged progress feedback, labelled with the live provider (Gemma 4 via
  Google AI Studio) or the demo generator, duplicate-submission protection, and a note that image
  analysis can take up to two minutes.
- **Mind map** — React Flow canvas with a central topic, subtopics and concepts. Pan, zoom,
  mini-map, fit-to-view, node selection, drag-to-rearrange, and viewport preservation when
  switching tabs. Downloadable as a PNG.
- **Summary** — overview, structured sections, key-terms glossary, copy-to-clipboard.
- **Quiz** — 5 multiple-choice questions with four options each, answer locking, scoring,
  correct/wrong highlighting, explanations, retry, and `.txt` download with answer key.
- **Source image** — review the uploaded page with its metadata, plus return-to-workspace actions.
- **Robust states** — loading skeletons, error panels with retry, provider-aware error messages,
  and the uploaded image is preserved on failure so the user can retry immediately.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 6, React Router 6 |
| Styling | Tailwind CSS v4 (custom design tokens) |
| Mind map | `@xyflow/react` (React Flow 12) |
| Icons / export | Lucide React, `html-to-image` |
| Backend | Python FastAPI, Uvicorn, Pydantic v2 |
| AI | Google AI Studio, `google-genai`, model `gemma-4-31b-it` |
| Image validation | Pillow (decode + verify + full load) |
| Tests | pytest + FastAPI TestClient (httpx) |

---

## Architecture

```
cognexa/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, error handlers, lifespan
│   │   ├── config.py            # Pydantic settings (GOOGLE_API_KEY, model, timeout)
│   │   ├── schemas.py           # Stable API contract (StudyMaterial, ...)
│   │   ├── errors.py            # Structured error envelope + handlers
│   │   ├── validation.py        # Layered image validation (Pillow)
│   │   ├── storage.py           # Private uploads + in-memory result registry
│   │   ├── routes/
│   │   │   ├── health.py        # GET /api/health
│   │   │   ├── uploads.py       # POST /api/upload, GET /api/uploads/{id}
│   │   │   └── generate.py      # POST /api/generate, GET /api/results/{id}
│   │   └── services/
│   │       ├── base.py          # StudyMaterialGenerator interface
│   │       ├── gemma4.py        # Gemma 4 via Google AI Studio (active)
│   │       ├── mock_generator.py# Offline mock generator (optional)
│   │       └── mock_content.py  # Handcrafted demo content
│   ├── tests/                   # 28 tests: health, validation, generation, Gemma parsing
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/               # LandingPage, WorkspacePage, ResultsPage
│   │   ├── components/results/  # MindMapTab, SummaryTab, QuizTab, SourceTab
│   │   ├── components/          # Header, Footer, Logo, DemoBadge
│   │   ├── lib/api.ts           # Typed API client + error mapping
│   │   ├── lib/serverInfo.ts    # Provider info for honest UI copy
│   │   ├── lib/export.ts        # PNG / clipboard / text-file helpers
│   │   └── types/api.ts         # TypeScript mirror of the backend contract
│   └── vite.config.ts           # /api proxy → FastAPI
├── sample/sample_response.json  # Real captured Gemma 4 API response
├── .env.example                 # Full env template (no secrets)
└── .gitignore
```

**Request flow (live generation)**

```
Browser                      FastAPI                              Google AI Studio
  │  POST /api/upload           │                                      │
  │ ───────────────────────────▶ │ validate ext/MIME/size/content       │
  │                              │ store privately as uuid.*            │
  │ ◀──────────── upload_id ─────│                                      │
  │  POST /api/generate          │                                     │
  │ ───────────────────────────▶ │ read stored image bytes             │
  │                              │ ─── image + prompt ────────────────▶ │ gemma-4-31b-it
  │                              │ ◀── JSON study plan ──────────────── │
  │                              │ validate + normalize → StudyMaterial │
  │ ◀──── StudyMaterial ──────── │                                      │
  │  GET /api/results/{id}       │
  │  GET /api/uploads/{upload_id}│ (source-image review)
```

---

## Quick start

### 1. Backend (FastAPI)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # then set GOOGLE_API_KEY
uvicorn app.main:app --reload --port 8000
```

Set the key in `backend/.env` (never commit it):

```dotenv
AI_PROVIDER=gemma4
GOOGLE_API_KEY=your-google-ai-studio-key
GEMMA_MODEL=gemma-4-31b-it
```

Without a key, set `AI_PROVIDER=mock` to run the offline demo generator — the UI clearly
labels those results as demo data.

- API: `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/api/health`

> **Python 3.9 note:** `google-genai` pulls in `cryptography`, which may try to build from source
> on Python 3.9. Preinstall a wheel first: `pip install "cryptography==43.0.3" --only-binary=:all:`.

### 2. Frontend (Vite)

```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173
```

The dev server proxies `/api` to `http://localhost:8000`. If the backend runs elsewhere:

```bash
VITE_PROXY_TARGET=http://localhost:8001 npm run dev
# or point the built app at an explicit API base:
VITE_API_BASE_URL=https://api.example.com/api npm run build
```

### 3. Production build

```bash
cd frontend && npm run build       # type-checks with tsc, outputs dist/
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Deployment split.** The app ships as two services, so the frontend must call the backend by
absolute URL — Vercel serves `frontend/dist` as static files and has no API routes:

| Part | Host | Notes |
|---|---|---|
| Frontend | Vercel, root directory `frontend` | Build `npm run build`, output `dist` |
| Backend | Render, root directory `backend` | Start `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

Production builds default to `https://cognexa-p9yo.onrender.com/api` (see
`frontend/src/lib/api.ts`). To point a build at a different backend, set `VITE_API_BASE_URL`
(including the `/api` prefix) in the host's build environment.

Set `CORS_ORIGINS` on the backend to every origin that serves the frontend, e.g.
`https://cognexa-psi.vercel.app`. `frontend/vercel.json` rewrites unknown paths to
`index.html` so client-side routes like `/workspace` survive a refresh.

---

## API reference

All errors share one shape:

```json
{ "error": { "code": "file_too_large", "message": "...", "detail": null } }
```

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Status, active provider, AI configuration (never the key) |
| `POST` | `/api/upload` | Multipart image upload (`file`), validated and stored privately |
| `POST` | `/api/generate` | JSON `{ "upload_id": "..." }` → complete `StudyMaterial` |
| `GET` | `/api/results/{result_id}` | Retrieve a generated result |
| `GET` | `/api/uploads/{upload_id}` | Stream the uploaded source image for review |

**Health response** (live Gemma 4 configuration):

```json
{
  "status": "ok",
  "service": "cognexa-backend",
  "demo_mode": false,
  "ai_provider": "gemma4",
  "ai_configured": true,
  "reserved_gemma_model": "gemma-4-31b-it",
  "max_upload_mb": 10
}
```

**Upload response:**

```json
{
  "upload_id": "5defffce35464882af830b9be076ced6",
  "filename": "photosynthesis-ch4.png",
  "content_type": "image/png",
  "size_bytes": 29826,
  "width": 1000,
  "height": 1300,
  "stored_format": "PNG"
}
```

**Generate response:** see [`sample/sample_response.json`](sample/sample_response.json) — a real
response captured from `gemma-4-31b-it` through this backend. Its stable top-level shape is:

```json
{
  "result_id": "706a375f...",
  "is_demo": false,
  "generator": "gemma4",
  "main_topic": { "id": "photosynthesis-topic", "label": "Photosynthesis" },
  "subtopics": [{ "id": "photosynthesis-sub-0", "label": "Light Reactions" }],
  "nodes": [
    {
      "id": "photosynthesis-topic",
      "label": "Photosynthesis",
      "node_type": "topic",
      "parent": null,
      "position": { "x": 0, "y": 0 }
    }
  ],
  "edges": [
    {
      "id": "e-photosynthesis-topic-photosynthesis-sub-0",
      "source": "photosynthesis-topic",
      "target": "photosynthesis-sub-0",
      "label": "includes"
    }
  ],
  "summary": {
    "overview": "...",
    "sections": [{ "title": "Light reactions", "content": "..." }]
  },
  "key_terms": [{ "term": "Chlorophyll", "definition": "..." }],
  "questions": [
    {
      "id": "q1",
      "question": "In which part of the plant cell does photosynthesis occur?",
      "type": "multiple_choice",
      "options": ["Nucleus", "Chloroplasts", "Ribosomes", "Mitochondria"],
      "correct_answer": "Chloroplasts",
      "explanation": "..."
    }
  ],
  "source_image": {
    "upload_id": "5defffce...",
    "filename": "photosynthesis-ch4.png",
    "content_type": "image/png",
    "size_bytes": 29826,
    "width": 1000,
    "height": 1300,
    "url": "/api/uploads/5defffce35464882af830b9be076ced6"
  }
}
```

Node types are `topic`, `subtopic` and `concept`; each node has a stable id, label, type, a
`parent` id (null for the central topic) and an initial canvas position. Every edge references
existing node ids, and every quiz answer is one of its option strings.

### Status codes

| Code | When |
|---|---|
| `200` | Success |
| `400` | Empty upload |
| `404` | Unknown upload/result id |
| `413` | File exceeds the 10 MB limit |
| `415` | Bad extension, MIME type, fake/truncated image, or MIME/content mismatch |
| `422` | Malformed generate payload, or Gemma 4 reports the page unreadable |
| `429` | Gemma 4 rate limit / quota exhausted |
| `500` | Unexpected server error (generic message, logged server-side) |
| `502` | Model unavailable to this key, invalid model input, or unusable model output |
| `503` | Missing/invalid credentials, provider temporarily unavailable |
| `504` | Gemma 4 request timed out |

---

## Configuration

Environment variables (see [`.env.example`](.env.example) / [`backend/.env.example`](backend/.env.example)):

| Variable | Default | Purpose |
|---|---|---|
| `AI_PROVIDER` | `mock` | `gemma4` (Google AI Studio) or `mock` (offline demo) |
| `GOOGLE_API_KEY` | *(empty)* | Google AI Studio key — **backend only**, never exposed |
| `GEMMA_MODEL` | `gemma-4-31b-it` | Exact Gemma 4 model id (no substitutions) |
| `AI_TIMEOUT_SECONDS` | `180` | Timeout for image analysis requests |
| `MAX_UPLOAD_MB` | `10` | Upload size limit |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173,https://cognexa-psi.vercel.app` | Allowed frontend origins (explicit list) |
| `UPLOAD_DIR` | `uploads` | Private storage directory (relative to `backend/`) |
| `MOCK_PROCESSING_DELAY` | `0.4` | Simulated latency for the mock provider only |

The API key is read from the environment (or `backend/.env`, which is gitignored). It is never
logged, returned in responses, written to the frontend or committed.

---

## How the Gemma 4 integration works

**Model and SDK**

```python
import os
from google import genai

client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
MODEL_ID = "gemma-4-31b-it"
```

**Verified against the live API** (Google AI Studio): the model is listed for this key, accepts
image input, and correctly read a test textbook page. Use the bare id `gemma-4-31b-it`; the
`models/gemma-4-31b-it` prefix returns a 500 from the endpoint.

**Generation** (`backend/app/services/gemma4.py`)

1. The existing upload is read from private storage (validation already ran at upload time).
2. The image bytes are sent with `types.Part.from_bytes(...)` plus a prompt that requests a
   strict JSON study plan (topic, description, summary sections, key terms, 4–6 subtopics with
   concepts, exactly 5 MCQs with 4 options and a `correct_index`).
3. JSON mode is **not** relied upon (it returned 503 on this model), so the response is parsed
   robustly: code fences are stripped, the JSON object is extracted, and output is validated with
   Pydantic + explicit rules (edge targets exist, questions have exactly 4 distinct options, the
   correct index maps to a real option, minimum subtopics/key terms).
4. Validated content is converted into the existing `StudyMaterial` contract, with node ids,
   edges and radial positions generated server-side so the mind map always renders cleanly.
5. `is_demo: false` and `generator: "gemma4"` are returned; the UI shows an AI-generated badge.

**Failure handling**

- Missing key → `503` with a clear configuration message.
- Rate limit / quota → `429`; transient provider outage → `503`; timeout → `504`.
- Model not available to the key → `502`, naming the model; no other model is tried.
- Malformed/incomplete model output → `502`, with no invented content.
- **No automatic retries and no model switching.** The upload is preserved in the frontend so the
  user can retry immediately.
- Error messages never include the API key.

---

## Testing & verification

```bash
# Backend: 28 tests (health, upload validation, mock generation, Gemma parsing/normalization)
cd backend && .venv/bin/python -m pytest

# Frontend: strict TypeScript + production build
cd frontend && npm run build
```

The suite verifies, among other things:

- health reports provider/model honestly and never leaks the key;
- PNG/JPEG uploads succeed with server-generated ids, correct dimensions and format;
- bad extension, bad MIME, fake image content, truncated image, empty file and >10 MB files are
  rejected with structured errors;
- unknown upload/result ids return 404, malformed ids return 422;
- generated (mock) results contain the full contract: unique node ids, edges referencing real
  nodes, parent/edge topology consistency, 3–5 scorable questions with explanations;
- Gemma output parsing rejects malformed JSON, wrong option counts, out-of-range correct indices,
  too few subtopics, and model "unreadable page" payloads;
- valid Gemma output builds the exact frontend contract with consistent edges and answer strings.

**Live verification performed:**

- `GET /api/health` → `ai_provider: gemma4`, `ai_configured: true`, model `gemma-4-31b-it`.
- `POST /api/upload` with a 1000×1300 textbook page → 200, stored privately.
- `POST /api/generate` → **real Gemma 4 result in ~111 s**: topic “Photosynthesis”, 22 nodes,
  21 edges, 5 questions × 4 options, 9 key terms, `is_demo: false`, `generator: gemma4`.
- `GET /api/results/{id}` and `GET /api/uploads/{id}` both return the stored result/image.
- Frontend production build passes; the UI badge reads GEMMA 4 · AI-GENERATED for live results.

---

## Security & reliability

- **API key stays on the backend** in `GOOGLE_API_KEY`; `.env` is gitignored, keys are never
  logged, returned, or bundled into frontend code.
- **Layered upload validation:** extension, declared MIME, byte size (streamed, aborted at the
  limit), and a real Pillow decode + `verify()` + full `load()`. Declared MIME must match the
  decoded format.
- **Server-generated filenames** (`uuid4().hex` + extension from the decoded format); the
  original filename is display-only metadata.
- **Private storage:** uploads live in `backend/uploads/` (gitignored, never statically served)
  and are streamed back only via `/api/uploads/{uuid}` with strict id validation.
- **CORS locked** to configured origins; methods limited to GET/POST/OPTIONS.
- **Structured errors** with useful status codes; unexpected exceptions are logged and returned
  as a generic 500.
- Images are sent to Google AI Studio only when `AI_PROVIDER=gemma4`; mock mode stays offline.
- No accounts, tracking, or personal data collection.

---

## Current limitations

- **Latency:** Gemma 4 image analysis can take 40–120 s per page in this environment; the UI
  shows a live-generation notice and the request timeout defaults to 180 s.
- **Provider limits:** the AI Studio quota may rate-limit requests (`429` / `503`); the app
  reports these errors clearly and the user can retry — it never falls back to another model.
- **Results and uploads are in memory + local disk**; they clear when the backend restarts
  (no database, per project scope). A restart shows a friendly "create it again" error screen.
- **PNG export** renders the map at 2× viewport; very large custom layouts may need zooming out.
- The `mock` provider remains available for offline demos and tests and is always labelled.

---

## Hackathon demo script

1. Open the landing page — the hero states the active provider (Gemma 4 via Google AI Studio).
2. Click **Create a Mind Map**, drop a textbook page photo (PNG/JPG).
3. Show the preview details, then **Generate Mind Map** — note the live generation label and
   that analysis can take up to two minutes.
4. On the results screen (GEMMA 4 · AI-GENERATED badge), drag a node, zoom, use the mini-map,
   then **Download PNG**.
5. Switch to **Summary** → **Copy summary**.
6. Switch to **Quiz**, answer all five questions, submit — show the score and explanations.
7. Open **Source Image** to show the uploaded page and return to the workspace.

---

## License

Built for HackFest 2.0 as a demonstration project. Uses the open-source libraries listed above
under their respective licenses.
