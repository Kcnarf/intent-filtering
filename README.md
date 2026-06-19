# intent-filtering

Single Page App experimenting NLP-based intent filtering on IMDB

The goal of this project is to replace traditional filters (checkbox, dropdowns, ...) by a text area where the user defines its filters in natural language, in order to ease User experience.

# Stages of the project

This project follows 5 stages :
  **STAGE 0 - Prerequisites**: build infrastructure, make documentation (README.md), make the project AI-ready (AGENTS.md, TESTING.md)
  **STAGE 1 - Backend**: build the backend (IMDb data, SQLite, Python/FastAPI, endpoints accepting filters as structured objects)
  **STAGE 2 - Frontend**: build the frontend (React/Next.js, Tailwind CSS, a dashboard with Big Numbers dataviz and traditional filters, requests to backend with filters sent as structured objects)
  **STAGE 3 - Intent filtering**: add NLP intent filtering — a `/intent` endpoint transforms raw natural language text into the same structured filter objects used by Stage 2
  **STAGE 4 - Deployment**: deploy the MVP as a live demo (Fly.io for the backend, Vercel for the frontend)
  **STAGE 5 - Scaling**: add many filters to evaluate scalability of the approach

The current stage is **STAGE 3 - Intent filtering**

# Stack

| Layer | Technology |
|---|---|
| Backend language | Python 3.12 |
| Dependency manager | uv |
| API framework | FastAPI + uvicorn |
| Database | SQLite |
| SQL middleware | SQLAlchemy 2.0 async + aiosqlite |
| Data validation | Pydantic v2 (bundled with FastAPI) |
| Frontend framework | Next.js 16 (App Router) + React 19 |
| Frontend language | TypeScript |
| Frontend package manager | pnpm |
| Component library | shadcn/ui |
| Styling | Tailwind CSS v4 |
| NLP | LLM API call from FastAPI backend (Stage 3) |
| Backend hosting | Fly.io (Stage 4) |
| Frontend hosting | Vercel (Stage 4) |

# Repository structure

```
./api/                  backend
  scripts/              ETL and utility scripts
    etl.py              downloads IMDb TSVs, builds the SQLite database
  data/                 gitignored — generated locally by running etl.py
    imdb.db             SQLite database
./frontend/             frontend SPA (Next.js, App Router)
  src/
    app/
      layout.tsx        root layout, metadata, fonts
      page.tsx          main dashboard page (state + layout)
      globals.css       Tailwind base styles
    components/
      ui/               shadcn/ui generated components
      BigNumber.tsx     reusable stat card (type, value, optional children)
      MovieList.tsx     movie list sorted by descending score
      FilterChips.tsx   active filter chips (always visible, removable)
      FilterPanel.tsx   filter controls (genre, year, rating, votes)
      IntentInput.tsx   natural-language filter input (textarea, loading state, LLM message display)
    lib/
      types.ts          TypeScript interfaces matching API schemas
      api.ts            fetchMoviesStat(), fetchMovies(), fetchIntent()
  .env.local            gitignored — set NEXT_PUBLIC_API_URL
```

# Prerequisites

**Backend** — uses `uv` as Python installer and dependency manager.

If not yet installed, install `uv` via the standalone installer (works on all macOS versions — do not use Homebrew for uv):
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Then install Python 3.12 via uv (no separate Python installation needed):
```bash
uv python install 3.12
```

**Frontend** — uses `pnpm` as package manager. Requires Node.js ≥ 18.

If not yet installed, install `pnpm` via:
```bash
npm install -g pnpm
```

# Quick start

Install dependencies:
```bash
cd api
uv sync
```

Run the ETL script once to build the local database (requires an internet connection, ~5 min):
```bash
uv run python scripts/etl.py
```

Launch the backend API:
```bash
uv run uvicorn app.main:app --reload
```

Run the test suite:
```bash
uv run pytest
```

Install frontend dependencies and launch the frontend:
```bash
cd frontend
pnpm install
pnpm dev
```

Create `.env.local` and set:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
