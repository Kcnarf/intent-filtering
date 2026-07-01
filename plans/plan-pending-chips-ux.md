# PLAN-pending-chips-ux.md

## Design decisions

- Remove both "Apply intent" and "Apply filter" buttons; replace with a single "Apply filters" action in the pending chips row
- All filter modifications (intent, panel sliders, chip removal) write to pending state only — never directly to active state
- Pending chips row appears **above** the active row (closer to the dashboard), visible only when pending ≠ active
- Pending row contains: proposed filter chips (removable) + "Apply filters" button + "Discard" button
- "Discard" reverts pending state to active state, removing the pending row
- "Clear all" on active row sets pending to `{}` (empty pending state); no "Clear all" on pending row (would be redundant)
- Intent textarea: Enter key submits, Shift+Enter inserts newline, text is NOT cleared after submit
- LLM receives pending filter state as context; falls back to active state when no pending changes exist
- No backend changes needed (`fetchIntent` already accepts `currentFilters: FilterParamsBody`)
- `pendingDirty: boolean` flag tracks whether pending differs from active (avoids deep object comparison)

## Path

1. **Intent submission** — "Apply intent" button replaced by Enter key; textarea not cleared after submit
2. **Filter panel** — "Apply filter" button removed; panel controls already write to pending state immediately (no behavioral change)
3. **Pending chips row** — added above the active chips row, visible only when pending ≠ active; shows proposed filter values + "Apply filters" action + "Discard" action
4. **Active chip removal** — writes to pending state instead of immediately updating active state
5. **"Apply filters"** — commits pending → active, triggers data fetch
6. **"Discard"** — reverts pending state to active state, removes pending row
7. **LLM context** — receives pending state; falls back to active when no pending exists

No backend changes.

## Plan

### Task A — State wiring + FilterPanel cleanup
**Files**: `frontend/src/app/page.tsx`, `frontend/src/components/FilterPanel.tsx`

**`page.tsx`**
- Add `const [pendingDirty, setPendingDirty] = useState(false)`
- Compute `const { limit: _l, offset: _o, ...activeFiltersBody } = activeFilters` and `const displayFilters = pendingDirty ? pendingFilters : activeFiltersBody`
- Add `updatePending(f: FilterParamsBody)` → `setPendingFilters(f)` + `setPendingDirty(true)`
- Add `applyPending()` → `setActiveFilters({...pendingFilters})` + `setPendingDirty(false)`
- Add `discardPending()` → `setPendingFilters(activeFiltersBody)` + `setPendingDirty(false)`
- Replace `handleApply` with `applyPending`
- Replace `handleChipRemove` with `handleActiveChipRemove(updated: FilterParams)`: strips limit/offset, calls `updatePending(body)` — no longer touches `activeFilters` directly
- Pass `displayFilters` (not `pendingFilters`) to `FilterPanel` and `IntentInput`
- Replace all `onPendingChange={setPendingFilters}` with `onPendingChange={updatePending}`
- Pass `hasPendingChanges={pendingDirty}`, `onApply={applyPending}`, `onDiscard={discardPending}` to `FilterChips`
- Remove `onApply` from `FilterPanel` props

**`FilterPanel.tsx`**
- Remove `onApply` from `FilterPanelProps` interface
- Remove `<Button variant="default" onClick={onApply}>Apply</Button>` (line 297)

### Task B — IntentInput + pending chips row
**Files**: `frontend/src/components/IntentInput.tsx`, `frontend/src/components/FilterChips.tsx`

**`IntentInput.tsx`**
- Rename prop `pendingFilters` → `contextFilters` (type unchanged: `FilterParamsBody`)
- Add `onKeyDown` on textarea: `Enter` (without Shift) calls `handleSubmit` + `e.preventDefault()`; Shift+Enter keeps default newline
- Remove `<Button>` "Apply intent" (lines 44–46)
- Text is NOT cleared on submit (no `setText("")` exists already — nothing to remove)
- Keep message/error display unchanged

**`FilterChips.tsx`**
- Add `hasPendingChanges: boolean`, `onDiscard: () => void` to `FilterChipsProps`
- When `hasPendingChanges`, render pending chips row **above** active row:
  - Chips built from `buildChips(pendingFilters as FilterParams)`; each chip remove calls `onPendingChange(chip.clear as FilterParamsBody)`
  - "Apply filters" button: `onClick={onApply}`
  - "Discard" button: `onClick={onDiscard}` (ghost/outline variant)
  - Pending chips visual: `bg-primary/10 border-primary` (vs active `bg-secondary border-border`)
- Update "Clear all" on active row: remove `onChange({})` call, keep only `onPendingChange({})`

## TODO list

- [x] **A1** — `page.tsx`: add `pendingDirty` state, helpers (`updatePending`, `applyPending`, `discardPending`), `displayFilters`, updated handlers and prop passing
- [x] **A2** — `FilterPanel.tsx`: remove `onApply` prop + Apply button
- [x] **B1** — `IntentInput.tsx`: rename prop, Enter key submit, remove Apply intent button
- [x] **B2** — `FilterChips.tsx`: pending chips row above active row, Discard button, update Clear all
