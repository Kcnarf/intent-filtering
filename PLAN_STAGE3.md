# Stage 3 — Intent Filtering: Plan & TODO

## Path (agreed system-level changes)

1. Update the intent endpoint to accept both the user's text and the current filter state as input
2. Update the intent endpoint response to include the resolved filter state and an optional clarification message
3. Implement the LLM call (Anthropic Haiku) with structured output — the LLM receives the current filters + the user's text and decides whether to fully replace or merge; a system prompt restricts it to the movie-filter domain
4. Add per-IP rate limiting to the intent endpoint
5. Add a global daily call counter (in-process app state, reset at midnight) with a hard cap; return a clear error when the cap is reached
6. Split filter state into two: active filters (drives data fetching) and pending filters (drives the filter panel controls)
7. Add an Apply button to the filter panel that commits pending → active and triggers a data refresh
8. Wire up the intent input: on submit, call the intent endpoint with the current text and pending filters, then update pending filters with the response
9. Display the LLM's optional message (ambiguity/clarification) near the intent input

## Design decisions (agreed)

- `POST /api/intent` accepts `{ intent_text, current_filters }`, returns `{ filters, message? }`
- LLM (Anthropic Haiku) receives current filter state + user text; decides full replace vs. merge/add/remove via system prompt reasoning
- Ambiguity → return current filters unchanged + explanatory message (user must rephrase)
- Per-IP rate limiting (slowapi) + global daily cap (in-process counter, thread-safe, daily reset)
- Frontend: `activeFilters` (drives data fetch) vs `pendingFilters` (drives filter panel controls)
- Apply button in FilterPanel commits pending → active
- Chip removal updates both active and pending immediately (bypasses Apply — no regression on next Apply)
- LLM call uses Anthropic tool use with `tool_choice={"type":"tool","name":"set_filters"}` to force structured output
- Workflow: TDD (tests written and approved before implementation)

## TODO list

### Backend

- [x] **B0** — Add `anthropic` and `slowapi` dependencies (`uv add anthropic slowapi` in `api/`)
- [x] **B1** — Add `FilterParamsBody`, `IntentOut` to `api/app/schemas.py`
  - `FilterParamsBody` (Pydantic BaseModel, response-only): `genres_or`, `genres_and`, `year_min`, `year_max`, `rating_min`, `votes_min` — no `limit`/`offset`
  - `IntentOut`: `filters: FilterParamsBody`, `message: str | None = None`
  - No `IntentRequest` — endpoint is GET; `intent_text: str` and filter fields arrive as query params via `FilterParams`
- [x] **B2** — Add `intent_daily_cap: int = 100` to `Settings` in `api/app/config.py`
- [x] **B3** *(TDD — write & get approval before B4/B5)* — Create `api/tests/test_intent.py`
  ```
  class TestPostIntent:
    class TestHappyPath:
      test_should_return_filters_extracted_from_intent_text
      test_should_return_200_with_intent_response_shape
    class TestAmbiguity:
      test_should_return_current_filters_when_llm_signals_ambiguity
      test_should_return_message_when_llm_signals_ambiguity
    class TestDailyCap:
      test_should_return_429_when_daily_cap_exceeded   # override cap to 1, call twice
      test_should_return_200_when_within_daily_cap
  ```
  Mock strategy: `unittest.mock.patch` on `anthropic.AsyncAnthropic` in `app.routers.intent`
- [x] **B4** *(after B3 approved)* — Create `api/app/routers/intent.py`
  - Module-level `_DailyCap` class (thread-safe, daily reset via `threading.Lock` + `datetime.date`)
  - Expose `reset_daily_cap()` for test teardown
  - Module-level `Limiter` (slowapi, `key_func=get_remote_address`), `@limiter.limit("10/minute")`
  - System prompt: restrict to movie-filter context; return current filters + message for off-topic/ambiguous
  - Single Anthropic tool `set_filters` with `input_schema` = `FilterParamsBody` fields + optional `message: str`
  - `GET /api/intent` handler: `intent_text: str` + `filters: FilterParams = Depends()` as query params; check daily cap → call LLM → extract tool_use block → return `IntentOut`
- [x] **B5** *(after B4)* — Update `api/app/main.py`
  - Import `intent_router` + `limiter` from `app.routers.intent`
  - `app.state.limiter = limiter`
  - Add slowapi middleware + `RateLimitExceeded` exception handler
  - Register `intent_router` with `/api` prefix
- [x] **Run tests** — `cd api && uv run pytest` (39 passed, no regressions)

### Frontend

- [ ] **F1** — Add intent types to `frontend/src/lib/types.ts`
  - `FilterParamsBody`: same fields as `FilterParams` without `limit`/`offset`
  - ~~`IntentRequest`~~ — not needed (GET endpoint, query params)
  - `IntentOut`: `{ filters: FilterParamsBody; message?: string }`
- [ ] **F2** — Add `fetchIntent` to `frontend/src/lib/api.ts`
  - `fetchIntent(intentText: string, currentFilters: FilterParamsBody): Promise<IntentOut>`
  - GET with query string: appends `intent_text` + all `FilterParamsBody` fields (reuses `toQueryString` pattern)
- [ ] **F3** — Update `frontend/src/components/FilterPanel.tsx`
  - Rename `onChange` prop → `onPendingChange` (same signature)
  - Add `onApply: () => void` prop
  - Add Apply button (shadcn/ui `Button`, variant `"default"`) at bottom of panel
- [ ] **F4** — Update `frontend/src/components/FilterChips.tsx`
  - Add props: `pendingFilters: FilterParamsBody`, `onPendingChange`, `onApply`
  - Pass them to the embedded mobile `FilterPanel`
  - Chip removal: update both `activeFilters` (via `onChange`) AND `pendingFilters` (via `onPendingChange`)
- [ ] **F5** — Implement `frontend/src/components/IntentInput.tsx`
  - Props: `pendingFilters: FilterParamsBody`, `onPendingChange: (f: FilterParamsBody) => void`
  - Local state: `text`, `loading`, `message`
  - Submit: call `fetchIntent` → `onPendingChange(response.filters)` + set message
  - UI: enabled textarea, Submit button (disabled while loading), message line below
  - Message clears when user starts typing
- [ ] **F6** — Refactor `frontend/src/app/page.tsx`
  - Split `filters` → `activeFilters: FilterParams` + `pendingFilters: FilterParamsBody` (both init `{}`)
  - `useEffect` depends on `[activeFilters]` only
  - `handleApply`: `setActiveFilters({ ...pendingFilters })`
  - `handleChipRemove(updated)`: update both `activeFilters` and `pendingFilters`
  - Wire `FilterPanel`: `filters={pendingFilters}` + `onPendingChange={setPendingFilters}` + `onApply={handleApply}`
  - Wire `FilterChips`: `filters={activeFilters}` + `onChange={handleChipRemove}` + pending props
  - Wire `IntentInput`: `pendingFilters={pendingFilters}` + `onPendingChange={setPendingFilters}`
- [ ] **Type-check** — `cd frontend && pnpm tsc --noEmit` (no errors)

## Execution order

```
B0 (done) → B1 → B2 → B3 (tests, await approval) → B4 → B5 → run tests
                                                   ↕
                    F1 → F2 → F3 → F4 → F5 → F6 → type-check
```
Frontend can start from F1 in parallel once B1 schemas are defined.
