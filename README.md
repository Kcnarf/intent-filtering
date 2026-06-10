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

The current stage is **STAGE 1 - Backend**

# Stack

| Layer | Technology |
|---|---|
| Backend language | Python 3.12 |
| Dependency manager | uv |
| API framework | FastAPI + uvicorn |
| Database | SQLite |
| SQL middleware | SQLAlchemy 2.0 async + aiosqlite |
| Data validation | Pydantic v2 (bundled with FastAPI) |
| Frontend framework | React / Next.js (Stage 2) |
| Styling | Tailwind CSS (Stage 2) |
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
./frontend/             frontend SPA (Stage 2)
```

# Quick start

Run the ETL script once to build the local database (requires an internet connection, ~5 min):
```bash
cd api
uv run python scripts/etl.py
```

Then launch the backend API:
```bash
uv run uvicorn app.main:app --reload
```

Launch the frontend (Stage 2):
```bash
cd frontend
# TODO: npm run dev  (or equivalent once Stage 2 is implemented)
```
