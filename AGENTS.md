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
  - **use the below (ReAct-based) agentic Reason->Persist->Act workflow** :
    - **Continuation shortcut:** Before starting step 1 REASON, scan the `plans/` directory for a `plan-*.md` file whose content covers the current task (check the `## Path` section). If one exists with a `## TODO list` containing unchecked items, step REASON is complete: briefly recap the remaining TODO items and proceed directly to step ACT.
    1. REASON :
      1.1. in a collaborative way (between the AI agent and human), align both the human and the AI agent on the objective; some key decisions may be made (eg. design, architecture, used libraries, etc.)
      1.2. wait for human approval of the objectives and decisions
      1.3. once the objective is well defined and decisions made, describe in natural language **what** changes are needed at a system/feature level (e.g. "update the backend endpoint to accept an array", "update the frontend fetch call"); no file names, function names, or test cases — those belong in the plan (step 1.5)
      1.4. wait for human approval of the path
      1.5. based on the approved path, plan the updates; this step defines **how** changes should be implemented
      1.6. wait for human approval of the plan
    2. PERSIST
      **before any file edit**: persist the plan to `plans/plan-<intent>.md`, where `<intent>` is a short kebab-case label for the feature or task (e.g. `plans/plan-add-auth.md`, `plans/plan-refactor-api.md`, `plans/plan-<issue_number>.md`). The file must include the following four sections **in this order**, mirroring the workflow's REASON steps that produced them:
        - `## Design decisions` — key choices agreed in steps 1.1–1.2 (architecture, libraries, trade-offs)
        - `## Path` — system-level description of what changes, agreed in steps 1.3–1.4
        - `## Plan` — detailed file/function-level breakdown from steps 1.5–1.6
        - `## TODO list` — markdown checkboxes, one per task, updated as work progresses
        > Note: `## Plan` and `## TODO list` may be merged when plan items are detailed enough to stand as self-contained tasks.

        This file is the authoritative cross-session record. **No file edit is allowed until it exists.**
    3. ACT :
      act by implementing the tasks of the TODO list
    - note: of course, developments and brainstorming with the human may impact the TODO list; in such a case, inform the human and ask for its approval
  - **clear separation of coding and testing tasks**: imperatively maintain strict separation between code and test changes, with Human-in-the-Loop (HITL) checkpoints. Two acceptable orderings:
    - **TDD (preferred)**: Update tests → wait for human approval → write implementation → wait for human approval → run tests (they should pass)
    - **Code-first**: Change code → wait for human approval → run tests → surface failures to human → propose test updates → wait for human approval → apply test fixes
  - **For multi-file changes**: If a task requires changes to more than 3 source files, stop and break it into smaller tasks first.
  - **Commits**: Never commit changes; the project maintainer handles this.

## Conventions

Coding and testing conventions are defined as skills. Invoke the relevant one before starting work, regardless of workflow mode:
- `/skill-coding` — coding rules for implementation sessions
- `/skill-testing` — testing rules for test sessions

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
| `movie_people` | (tconst, nconst, ordering) composite PK, category | title.principals |

Scope filter applied at ETL time: `titleType = 'movie'` and `numVotes >= 1000` (~50K rows).

### API endpoints

| Endpoint | Stage | Purpose |
|---|---|---|
| `GET /api/movies` | 1 | Returns paginated movies matching a structured filter object |
| `GET /api/movies/stat` | 1 | Returns stats (total count, average rating, total votes, rating distribution) for a filter |
| `GET /api/intent` | 3 | Accepts raw natural language text + current filter state, returns a structured filter object (LLM API call, server-side) |

The structured filter object is the shared contract between frontend and backend. Its shape is defined by a Pydantic model in the backend and reused across all three endpoints.

### Frontend (Stage 2)

Next.js 16 SPA (App Router, TypeScript, Tailwind CSS v4, shadcn/ui). Single dashboard page: three Big Number cards (total films, avg score with mini score distribution, total votes) + a movie list sorted by descending rating + filter controls. No paginated list of films — the primary view is aggregated.

Active filters are always visible as removable chips so that Stage 3 intent auto-population is immediately apparent to the user without opening any panel.

**Source files**:
```
api/
  app/
    config.py         pydantic-settings: DB path, CORS origins, LLM API key
    main.py           FastAPI app entry point, CORS config, lifespan
    database.py       async engine + session factory + create_tables()
    models.py         SQLAlchemy ORM models (movies, people, movie_people)
    schemas.py        Pydantic models (FilterParams, MovieOut, MoviesStatOut, …)
    routers/
      __init__.py     shared apply_filters() helper
      movies.py       GET /api/movies
      movies_stat.py  GET /api/movies/stat
      intent.py       GET /api/intent (Stage 3)
  scripts/
    etl.py            one-time ETL: download IMDb TSVs → SQLite
  tests/
    conftest.py       shared async client fixture
    test_main.py      GET /health, CORS middleware
    test_routers.py   GET /api/movies, GET /api/movies/stat
  data/               gitignored
frontend/
  src/
    app/
      layout.tsx      root layout, metadata, fonts
      page.tsx        main dashboard page — owns all state and data fetching
      globals.css     Tailwind base styles
    components/
      ui/             shadcn/ui generated components (button, badge, card, …)
      BigNumber.tsx   reusable stat card: type ('total_count'|'average_rating'|'total_votes'), value, optional children slot
      MovieList.tsx   movie list pre-sorted by average_rating desc
      FilterChips.tsx always-visible active filter chips with remove buttons
      FilterPanel.tsx filter controls: genre Select, year inputs (cross-validated: min≤max), rating Slider, votes Select
      IntentInput.tsx Stage 3 natural-language filter input: textarea, Submit button, loading state, displays LLM clarification message
    lib/
      types.ts        TS interfaces mirroring API Pydantic schemas
      api.ts          fetchMoviesStat(filters), fetchMovies(filters), fetchIntent(intentText, currentFilters)
      utils.ts        shadcn/ui class merging utility (cn)
  .env.local          gitignored — NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Frontend is not tested** — see TESTING.md. Backend integration tests are the quality gate.

## Common Commands

```bash
# ── Backend (from ./api/) ──────────────────────────────────────
# Install dependencies
uv sync

# Build the local database (first-time setup, ~5 min)
uv run python scripts/etl.py

# Run the API with hot reload
uv run uvicorn app.main:app --reload

# Run tests
uv run pytest

# ── Frontend (from ./frontend/) ───────────────────────────────
# Install dependencies
pnpm install

# Run the dev server (http://localhost:3000)
pnpm dev

# Type-check without building
pnpm tsc --noEmit
```

## Implementation Details

**Gitignore rules for data**: `./api/data/` must be gitignored entirely. The SQLite DB is ~30–60 MB and is regeneratable — it must never be committed.

**CORS**: enabled in FastAPI for localhost (frontend dev server on a different port).

**Environment config**: `.env` file + `pydantic-settings` for DB path, LLM API key, allowed origins.

**Migration strategy**: `CREATE TABLE IF NOT EXISTS` on startup (via SQLAlchemy metadata). No Alembic for this PoC.

**Filter surface (Stage 1–2)**: genre, year range, minimum rating, minimum vote count. People-based filters (director, actor) planned for Stage 5.

**Movies stat (Stage 1–2)**: total matching films, average rating, total votes, rating distribution (9 buckets from 1-2 to 9-10).

**Year range constraint**: `FilterParams` enforces `year_min ≤ year_max` via a Pydantic v2 `model_validator`. Violations return HTTP 422. A companion `ValidationError` exception handler in `main.py` is required because FastAPI does not automatically intercept Pydantic errors raised from `Depends()` models (only from request body parsing).



