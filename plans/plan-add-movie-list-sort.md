# Plan: Add Movie List Sort

## Design decisions

- **D1 — Sort parameter names**: `sort_by` (values: `average_rating` | `num_votes` | `start_year`) and `sort_direction` (values: `asc` | `desc`). Mirror DB column names for transparency.
- **D2 — Default sort**: `average_rating DESC` (matches current hardcoded behavior — backward compatible).
- **D3 — Sort in `FilterParams` only, not `FilterParamsBody`**: Sort is a view-control param like `limit`/`offset`; the intent endpoint stays unaffected.
- **D4 — Sort state is immediate**: Sort changes take effect immediately (no Apply button). Separate state from the pending/active filter cycle.
- **D5 — Sort UI: clickable column headers**: Sortable columns (year, avg rating, votes) have clickable headers. Clicking an inactive header sets it as sort field (defaults to `desc`). Clicking the active header toggles direction. Directional icon on active header.
- **D6 — `str, Enum` for Python sort types**: `class SortField(str, Enum)` and `class SortDirection(str, Enum)` — standard Python stdlib enums. FastAPI validates incoming query params against enum values automatically (invalid values → 422).

## Path

1. Backend gains sort enums and params (with defaults matching current behavior) + dynamic sort in the movies endpoint. App behavior is identical — existing frontend unaffected.
2. Backend tests cover sort field, sort direction, and invalid value rejection.
3. Frontend TypeScript types gain optional `sort_by` and `sort_direction` fields in `FilterParams`.
4. Frontend dashboard gains `sortBy`/`sortDirection` state wired to `fetchMovies`. App behavior still identical to before (defaults match backend defaults).
5. Frontend movie list gains sortable column headers with directional icons.

## Plan & TODO list

- [x] **Step 1 — Backend: sort enums, params, and dynamic sort**
  - `api/app/schemas.py`: add `from enum import Enum`; add `SortField(str, Enum)` (`average_rating`, `num_votes`, `start_year`) and `SortDirection(str, Enum)` (`asc`, `desc`) before `FilterParams`; add `sort_by` and `sort_direction` to `FilterParams.__init__` with defaults, stored as `self.sort_by`/`self.sort_direction`
  - `api/app/routers/movies.py`: import `SortDirection`, `SortField`; add module-level `SORT_COLUMN_MAP` dict; replace hardcoded `order_by` with dynamic sort using `SORT_COLUMN_MAP` and `params.sort_direction`

- [x] **Step 2 — Backend: tests for sort behavior**
  - `api/tests/test_routers.py` inside `TestGetMovies`:
    - `class TestSortByParam` (fixture: 3 movies with distinct rating/votes/year):
      - `test_should_sort_by_average_rating_desc_by_default`
      - `test_should_sort_by_num_votes_when_requested`
      - `test_should_sort_by_start_year_when_requested`
      - `test_should_reject_invalid_sort_by_value`
    - `class TestSortDirectionParam` (fixture: 3 movies with distinct ratings):
      - `test_should_sort_descending_by_default`
      - `test_should_sort_ascending_when_requested`
      - `test_should_reject_invalid_sort_direction_value`

- [x] **Step 3 — Frontend: type contract update**
  - `frontend/src/lib/types.ts`: add `SortField` and `SortDirection` union types; add `sort_by?: SortField` and `sort_direction?: SortDirection` to `FilterParams`

- [x] **Step 4 — Frontend: sort state + API wiring**
  - `frontend/src/app/page.tsx`: add `sortBy`/`sortDirection` state (defaults: `"average_rating"`/`"desc"`); build `movieParams` merging sort into `activeFilters` for `fetchMovies` (stat call unchanged); add sort to `useEffect` deps; pass `sortBy`, `sortDirection`, `onSortChange` to `MovieList`

- [x] **Step 5 — Frontend: sortable column header UI**
  - `frontend/src/components/SortableColumnHeader.tsx` (new): props `field`, `label`, `currentSortBy`, `currentSortDirection`, `onClick`; renders button with `ArrowUp`/`ArrowDown` when active, `ArrowUpDown` when inactive (lucide-react)
  - `frontend/src/components/MovieList.tsx`: add `sortBy`, `sortDirection`, `onSortChange` to props; add `handleColumnHeaderClick` function; add header row with `SortableColumnHeader` for year, rating, votes columns
