# Multi-Value Genre Filter — Task Plan

## Context

Upgrade the genre filter from a single value (`genre: str`) to two independent multi-value filters:

| Filter | Parameter | Semantics |
|---|---|---|
| Any-of | `genres_or` | movie matches if its genres contain **any** of the selected values |
| All-of | `genres_and` | movie matches only if its genres contain **all** of the selected values |

**Why two separate filters?** Beyond expressive power, the OR vs AND distinction is a deliberate Stage 3 test case: the LLM intent parser must disambiguate "Action or Comedy movies" from "Action and Comedy movies" — a subtle NLP challenge that will validate or reveal limits of the intent-filter approach.

All other filters (year, rating, votes) remain AND-combined as before.

---

## Status legend
- `[ ]` todo
- `[~]` in progress
- `[x]` done

---

## Strict mode workflow

TDD (preferred): write tests → wait for human approval → write code → wait for human approval → run tests.
Frontend has no tests → code-first → wait for human approval.

**App-always-working constraint**: every task leaves the app in a fully functional state.  
Migration strategy: **add new fields alongside `genre` → migrate frontend → remove `genre`**.

---

## Tasks

| # | Status | Type | Files (≤ 3) | Description |
|---|---|---|---|---|
| A1 | `[x]` | Tests | `api/tests/test_routers.py` | Add tests for `genres_or`, `genres_and`, and combined (keep `TestGenreParam`) |
| A2 | `[x]` | Code | `api/app/schemas.py`, `api/app/routers/__init__.py` | Add `genres_or` + `genres_and` alongside existing `genre` |
| A3 | `[x]` | Verify | — | `uv run pytest` — 31/31 passed |
| B1 | `[x]` | Code | `frontend/src/lib/types.ts`, `frontend/src/lib/api.ts` | Add new TS types; fix `toQueryString()` for arrays |
| B2 | `[x]` | Code | `frontend/src/components/FilterPanel.tsx`, `frontend/src/components/FilterChips.tsx` | Replace single genre `Select` with two multi-selects; update chips |
| A4 | `[x]` | Tests | `api/tests/test_routers.py` | Remove `TestGenreParam` (frontend no longer sends `genre`) |
| A5 | `[x]` | Code | `api/app/schemas.py`, `api/app/routers/__init__.py` | Remove `genre` field and filter logic |
| A6 | `[x]` | Verify | — | `uv run pytest` — 29/29 passed |

**App state at each task boundary:**

| After | App state |
|---|---|
| A1 | Working — new tests exist but fail (TDD red phase); old genre filter intact |
| A2 | Working — both old `genre` and new `genres_or`/`genres_and` filters functional |
| A3 | Verified |
| B1 | Working — type layer updated, no user-visible change |
| B2 | Working — new multi-select UI sends `genres_or`/`genres_and`; `genre` is no longer sent |
| A4 | Working — old tests removed; `genre` param still accepted by backend (but unused) |
| A5 | Working — `genre` removed from backend; frontend never sends it anyway |
| A6 | Verified — clean final state |

---

## Task A1 — Backend tests (add new, keep old)

**File**: `api/tests/test_routers.py`

Add three new nested classes inside `TestGetMovies`, **after** `TestGenreParam`. Do NOT modify `TestGenreParam`.

### `TestGenresOrParam`

```python
class TestGenresOrParam:
    @pytest.fixture(autouse=True)
    async def setup_data(self, test_db_session):
        test_db_session.add_all([
            Movie(id="tt0000001", primary_title="Action Movie", original_title="Action Movie",
                  start_year=2000, runtime_minutes=120, genres="Action",
                  average_rating=7.0, num_votes=50_000),
            Movie(id="tt0000002", primary_title="Drama Movie", original_title="Drama Movie",
                  start_year=2000, runtime_minutes=120, genres="Drama",
                  average_rating=7.0, num_votes=50_000),
            Movie(id="tt0000003", primary_title="Horror Movie", original_title="Horror Movie",
                  start_year=2000, runtime_minutes=120, genres="Horror",
                  average_rating=7.0, num_votes=50_000),
        ])
        await test_db_session.commit()

    async def test_should_filter_to_movies_matching_any_genre_when_multiple_provided(self, test_client):
        movies = (await test_client.get("/api/movies",
            params={"genres_or": ["Action", "Drama"], "limit": 100})).json()
        assert len(movies) == 2
        assert all(any(g in m["genres"] for g in ["Action", "Drama"]) for m in movies)

    async def test_should_filter_to_movies_of_that_genre_when_single_provided(self, test_client):
        movies = (await test_client.get("/api/movies",
            params={"genres_or": ["Action"], "limit": 100})).json()
        assert len(movies) == 1
        assert movies[0]["genres"] == "Action"

    async def test_should_return_all_movies_when_omitted(self, test_client):
        data = (await test_client.get("/api/movies/stat")).json()
        assert data["total_count"] == 3
```

### `TestGenresAndParam`

```python
class TestGenresAndParam:
    @pytest.fixture(autouse=True)
    async def setup_data(self, test_db_session):
        test_db_session.add_all([
            Movie(id="tt0000001", primary_title="Action Comedy", original_title="Action Comedy",
                  start_year=2000, runtime_minutes=120, genres="Action,Comedy",
                  average_rating=7.0, num_votes=50_000),
            Movie(id="tt0000002", primary_title="Action Only", original_title="Action Only",
                  start_year=2000, runtime_minutes=120, genres="Action",
                  average_rating=7.0, num_votes=50_000),
        ])
        await test_db_session.commit()

    async def test_should_filter_to_movies_matching_all_genres_when_multiple_provided(self, test_client):
        movies = (await test_client.get("/api/movies",
            params={"genres_and": ["Action", "Comedy"], "limit": 100})).json()
        assert len(movies) == 1
        assert movies[0]["id"] == "tt0000001"

    async def test_should_filter_to_movies_of_that_genre_when_single_provided(self, test_client):
        movies = (await test_client.get("/api/movies",
            params={"genres_and": ["Action"], "limit": 100})).json()
        assert len(movies) == 2
        assert all("Action" in m["genres"] for m in movies)

    async def test_should_return_all_movies_when_omitted(self, test_client):
        data = (await test_client.get("/api/movies/stat")).json()
        assert data["total_count"] == 2
```

### `TestGenresCombinedParam`

```python
class TestGenresCombinedParam:
    @pytest.fixture(autouse=True)
    async def setup_data(self, test_db_session):
        test_db_session.add_all([
            Movie(id="tt0000001", primary_title="Action Comedy", original_title="Action Comedy",
                  start_year=2000, runtime_minutes=120, genres="Action,Comedy",
                  average_rating=7.0, num_votes=50_000),
            Movie(id="tt0000002", primary_title="Action Drama", original_title="Action Drama",
                  start_year=2000, runtime_minutes=120, genres="Action,Drama",
                  average_rating=7.0, num_votes=50_000),
            Movie(id="tt0000003", primary_title="Horror", original_title="Horror",
                  start_year=2000, runtime_minutes=120, genres="Horror",
                  average_rating=7.0, num_votes=50_000),
        ])
        await test_db_session.commit()

    async def test_should_apply_both_or_and_and_filters_simultaneously(self, test_client):
        # genres_and=Action + genres_or=Comedy,Drama → must have Action AND (Comedy or Drama)
        # tt0000001 (Action,Comedy) ✓  tt0000002 (Action,Drama) ✓  tt0000003 (Horror) ✗
        movies = (await test_client.get("/api/movies",
            params={"genres_and": ["Action"], "genres_or": ["Comedy", "Drama"], "limit": 100})).json()
        assert len(movies) == 2
        assert all("Action" in m["genres"] for m in movies)
```

---

## Task A2 — Backend code

### `api/app/schemas.py`

**⚠️ Important:** `list[str]` fields in a Pydantic `BaseModel` used with `Depends()` silently discard repeated query params in FastAPI 0.136+. `FilterParams` must be a **class-based dependency** with `Annotated[list[str], Query()]` in `__init__`.

```python
from typing import Annotated
from fastapi import HTTPException, Query
from pydantic import BaseModel, ConfigDict


class FilterParams:
    def __init__(
        self,
        genre: str | None = None,                         # kept — removed in A5
        genres_or: Annotated[list[str], Query()] = [],
        genres_and: Annotated[list[str], Query()] = [],
        year_min: int | None = None,
        year_max: int | None = None,
        rating_min: float | None = None,
        votes_min: int | None = None,
        limit: int = 50,
        offset: int = 0,
    ):
        if year_min is not None and year_max is not None and year_min > year_max:
            raise HTTPException(status_code=422, detail="year_min must not exceed year_max")
        self.genre = genre
        self.genres_or = genres_or
        self.genres_and = genres_and
        self.year_min = year_min
        self.year_max = year_max
        self.rating_min = rating_min
        self.votes_min = votes_min
        self.limit = limit
        self.offset = offset
```

The year-range `model_validator` is replaced by a direct `HTTPException(422)` raise.
The `ValidationError` handler in `main.py` becomes unused but harmless — leave it.

### `api/app/routers/__init__.py`

Add OR/AND filter logic. Keep existing `genre` logic.

```python
from sqlalchemy import Select, or_
from ..models import Movie
from ..schemas import FilterParams


def apply_filters(query: Select, params: FilterParams) -> Select:
    if params.genre:                                      # kept — removed in A5
        query = query.where(Movie.genres.like(f"%{params.genre}%"))
    if params.genres_or:
        query = query.where(or_(*[Movie.genres.like(f"%{g}%") for g in params.genres_or]))
    if params.genres_and:
        for g in params.genres_and:
            query = query.where(Movie.genres.like(f"%{g}%"))
    if params.year_min is not None:
        query = query.where(Movie.start_year >= params.year_min)
    if params.year_max is not None:
        query = query.where(Movie.start_year <= params.year_max)
    if params.rating_min is not None:
        query = query.where(Movie.average_rating >= params.rating_min)
    if params.votes_min is not None:
        query = query.where(Movie.num_votes >= params.votes_min)
    return query
```

---

## Task B1 — Frontend data layer

### `frontend/src/lib/types.ts`

Add new fields alongside `genre`:

```typescript
export interface FilterParams {
  genre?: string          // kept — removed after B2
  genres_or?: string[]
  genres_and?: string[]
  year_min?: number
  year_max?: number
  rating_min?: number
  votes_min?: number
  limit?: number
  offset?: number
}
```

### `frontend/src/lib/api.ts`

Update `toQueryString()` to handle arrays via `append()`:

```typescript
function toQueryString(filters: FilterParams): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, String(v))
    } else {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}
```

---

## Task B2 — Frontend UI

### Install shadcn components (not currently in project)

```bash
cd frontend && pnpm dlx shadcn@latest add popover checkbox
```

### `frontend/src/components/FilterPanel.tsx`

Add a local `GenreMultiSelect` component at the top of the file (above `FilterPanel`):

```tsx
function GenreMultiSelect({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (genres: string[]) => void
}) {
  const [open, setOpen] = useState(false)

  const triggerLabel =
    selected.length === 0
      ? "All genres"
      : selected.length <= 2
        ? selected.join(", ")
        : `${selected.slice(0, 2).join(", ")} +${selected.length - 2}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between font-normal">
          {triggerLabel}
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2">
        <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
          {GENRES.map((g) => {
            const checked = selected.includes(g)
            return (
              <label key={g} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-accent">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) =>
                    onChange(v ? [...selected, g] : selected.filter((x) => x !== g))
                  }
                />
                <span className="text-sm">{g}</span>
              </label>
            )
          })}
        </div>
        {selected.length > 0 && (
          <Button variant="ghost" size="sm" className="mt-1 w-full text-xs" onClick={() => onChange([])}>
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
```

Replace the single genre `<div>` block with two `GenreMultiSelect` instances, and remove `genre` from `onChange` calls:

```tsx
{/* Genres: any of */}
<div className="flex flex-col gap-1.5">
  <label className="text-sm font-medium">Genres (any of)</label>
  <GenreMultiSelect
    selected={filters.genres_or ?? []}
    onChange={(genres) => onChange({ ...filters, genres_or: genres.length ? genres : undefined })}
  />
</div>

{/* Genres: all of */}
<div className="flex flex-col gap-1.5">
  <label className="text-sm font-medium">Genres (all of)</label>
  <GenreMultiSelect
    selected={filters.genres_and ?? []}
    onChange={(genres) => onChange({ ...filters, genres_and: genres.length ? genres : undefined })}
  />
</div>
```

### `frontend/src/components/FilterChips.tsx`

In `buildChips()`, replace the `genre` chip block with two blocks:

```typescript
if (filters.genres_or?.length) {
  chips.push({
    label: filters.genres_or.join(" or "),
    clear: { ...filters, genres_or: undefined },
  })
}

if (filters.genres_and?.length) {
  chips.push({
    label: filters.genres_and.join(" + "),
    clear: { ...filters, genres_and: undefined },
  })
}
```

---

## Task A4 — Remove old genre tests

**File**: `api/tests/test_routers.py`

Delete the `TestGenreParam` class entirely (both test methods + fixture).

---

## Task A5 — Remove old genre code

### `api/app/schemas.py`
- Remove `genre: str | None = None`
- Remove `from fastapi import Query` if no longer needed elsewhere (keep `Annotated` from `typing`)

### `api/app/routers/__init__.py`
- Remove the `if params.genre: ...` block

---

## Verification (after A6)

```bash
# Backend tests
cd api && uv run pytest

# TypeScript check
cd frontend && pnpm tsc --noEmit

# Start servers
cd api && uv run uvicorn app.main:app --reload   # terminal 1
cd frontend && pnpm dev                          # terminal 2
```

Open `http://localhost:3000` and verify:
- "Genres (any of)" popover: selecting Action + Comedy shows movies with either genre
- "Genres (all of)" popover: selecting Action + Comedy shows only movies tagged with both
- Both active simultaneously: intersection applies
- Chips: "Action or Comedy" for genres_or; "Drama + Thriller" for genres_and
- Removing a chip clears its group; "Clear all" resets everything
- Mobile Sheet renders updated FilterPanel correctly
