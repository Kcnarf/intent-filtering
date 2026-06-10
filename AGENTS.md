# AGENTS.md

Guidance for AI coding assistants (Claude Code, Cursor, Copilot, etc.) working on this repository.


## Workflow & Agent-Human Interaction Guidelines

This project supports two AI execution modes: Standard and Strict Maintainer (Reason->Act, strict code/test separation).

**Initialization Check:**
When starting a new session, or when the user asks to implement a new feature or non-trivial change, proactively ask ONE brief question before starting:
> "Do you want me to use the Maintainer's Strict Workflow (Reason->Act, strict code/test separation) for this task, or standard execution?"

- Do not ask this question for trivial tasks (e.g., fixing a typo, explaining code).
- If the user chooses "Standard", proceed normally with the domain rules defined in this file.
- If the user chooses "Strict", use the following human-agent interaction directives :
  - **use the agentic ReAct (Reason->Act) workflow** :
    1. reason/plan
    2. wait for human approval of the plan
    3. transform the plan into a TODO list
    4. act by implementing the tasks of the TODO list
    note: of course, developments and brainstorming with the human may impact the TODO list; in such a case, inform the human and ask for its approval
  - **clear separation of coding and testing tasks**: imperatively maintain strict separation between code and test changes, with Human-in-the-Loop (HITL) checkpoints. Two acceptable orderings:
    - **TDD (preferred)**: Update tests → wait for human approval → write implementation → wait for human approval → run tests (they should pass)
    - **Code-first**: Change code → wait for human approval → run tests → surface failures to human → propose test updates → wait for human approval → apply test fixes
  - **For multi-file changes**: If a task requires changes to more than 3 source files, stop and break it into smaller tasks first.
  - **Commits**: Never commit changes; the project maintainer handles this.

## Project Overview

A Single Page App experimenting with NLP-based intent filtering on IMDb data. The goal is to replace traditional UI filters (checkboxes, dropdowns) with a natural-language text area, improving UX by letting users describe what they want in plain text.

This project also serves as a portfolio showcase ("vitrine") of agent-human HITL methodology and hands-on experimentation with Python/FastAPI.

## Architecture

**Backend language**: Python 3.12, managed with `uv`

**API framework**: FastAPI + uvicorn (ASGI)

**Database**: SQLite at `./api/data/imdb.db` (gitignored — generated locally by the ETL script)

**SQL middleware**: SQLAlchemy 2.0 async + aiosqlite

**Data source**: IMDb free TSV datasets (`datasets.imdbws.com`) — downloaded and discarded by the ETL script; never committed to git

### Database schema

| Table | Key columns | Source IMDb file |
|---|---|---|
| `movies` | tconst PK, primaryTitle, startYear, runtimeMinutes, genres, averageRating, numVotes | title.basics + title.ratings |
| `people` | nconst PK, primaryName, birthYear | name.basics |
| `movie_people` | tconst FK, nconst FK, ordering, category | title.principals |

Scope filter applied at ETL time: `titleType = 'movie'` and `numVotes >= 1000` (~80K rows).

### API endpoints

| Endpoint | Stage | Purpose |
|---|---|---|
| `GET /movies` | 1 | Returns movies matching a structured filter object |
| `GET /aggregates` | 1 | Returns Big Numbers (total count, average rating, top genre, …) for a filter |
| `POST /intent` | 3 | Accepts raw natural language text, returns a structured filter object (LLM API call, server-side) |

The structured filter object is the shared contract between frontend and backend. Its shape is defined by a Pydantic model in the backend and reused across all three endpoints.

### Frontend (Stage 2)

React / Next.js SPA with Tailwind CSS. Single dashboard page: Big Numbers dataviz + filter panel. No paginated list of films — the primary view is aggregated.

**Source files** (planned, will be updated as implementation proceeds):
```
api/
  app/
    main.py           FastAPI app entry point, CORS config
    models.py         SQLAlchemy ORM models (movies, people, movie_people)
    schemas.py        Pydantic models (filter object, response shapes)
    database.py       async engine + session factory
    routers/
      movies.py       GET /movies
      aggregates.py   GET /aggregates
      intent.py       POST /intent (Stage 3)
  scripts/
    etl.py            one-time ETL: download IMDb TSVs → SQLite
  data/               gitignored
```

## Common Commands

```bash
# Install dependencies (from ./api/)
uv sync

# Build the local database (first-time setup, ~5 min)
uv run python scripts/etl.py

# Run the API with hot reload
uv run uvicorn app.main:app --reload

# Run tests
uv run pytest
```

## Implementation Details

**Gitignore rules for data**: `./api/data/` must be gitignored entirely. The SQLite DB is ~30–60 MB and is regeneratable — it must never be committed.

**CORS**: enabled in FastAPI for localhost (frontend dev server on a different port).

**Environment config**: `.env` file + `pydantic-settings` for DB path, LLM API key, allowed origins.

**Migration strategy**: `CREATE TABLE IF NOT EXISTS` on startup (via SQLAlchemy metadata). No Alembic for this PoC.

**Filter surface (Stage 1–2)**: genre, year range, minimum rating, minimum vote count. People-based filters (director, actor) planned for Stage 5.

**Big Numbers (Stage 1–2)**: total matching films, average rating, top genre by count.

## Testing

The project includes a comprehensive test suite. See `TESTING.md` for detailed testing conventions, organization, and guidance for all contributors.
