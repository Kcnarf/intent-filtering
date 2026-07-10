# PLAN-filter-recap-rework.md

## Design decisions

- Consolidate the active/pending filter recap into the Filters Panel itself (desktop sidebar and mobile filter sheet), removing it from the main dashboard area on large screens entirely.
- Recap becomes a single inline chip flow (not two stacked rows): one item per touched filter dimension — a lone active chip, or an active→pending pair when that dimension has a proposed edit. Untouched dimensions produce no chip. A net-new pending value (no prior active) still pairs with the existing default-label placeholder as the "active" side of the pair.
- Chip `✕` behavior is unchanged: both active and pending chip removal call `onPendingChange` with a clear delta for that field — never touches active state directly. No new interaction model for chip removal.
- Recap + Apply filters / Discard / Clear all sits at the **top** of the Filters Panel content, above the intent input, above the traditional filter controls, and stays **sticky** while the rest of the panel scrolls. Same structure in the desktop sidebar and the mobile sheet.
- Mobile main area keeps active-only chips + "Clear all" + "Filters" button. Tapping a chip's `✕` or "Clear all" keeps mutating pending as today, and additionally opens the filter sheet so the result is visible.
- The "Filters" button label reflects the pending-change count (e.g. `Filters (2 pending changes)`, a placeholder copy to be revisited visually later) so nothing is silently lost if the sheet is dismissed without applying.
- Desktop main area loses its chip grid entirely — the sidebar is always visible, so it becomes the only place chips are shown.
- No backend changes, no changes to filter semantics or how pending/active state is computed — purely UI relayout and interaction consolidation.

## Path

1. Add a sticky recap block to the top of the Filters Panel content (desktop sidebar + mobile sheet), additive only.
2. Remove the desktop chip grid from the main area (now redundant).
3. Simplify the mobile main-area block to active-only chips + Clear all + Filters button (drop the pending row/Apply/Discard, now covered inside the sheet).
4. Filters button label reflects pending-change count.
5. Active-chip removal / Clear all (mobile) also opens the filter sheet.

Each step is independently deployable without breaking the app: step 1 is purely additive (old main-area chips untouched), steps 2–3 remove/simplify only what step 1 made redundant, steps 4–5 are independent behavior additions.

## Plan

Each task stays within the project's "≤3 source files per task" rule.

### Task 1 — Extract shared chip-building blocks (no behavior change)
**Files**: `frontend/src/components/FilterChip.tsx` (new), `frontend/src/lib/filterSlots.ts` (new), `frontend/src/components/FilterChips.tsx` (edit)

- Move the `FilterChip` presentational component (currently inlined in `FilterChips.tsx`, lines 34–61) into its own file, per the project's "components in their own file" convention.
- Move `buildGridSlots`/`yearLabel` and the `ActiveChip`/`PendingChip`/`GridSlot` types (lines 17–114) into `lib/filterSlots.ts`, renamed `buildFilterSlots`/`FilterSlot` (the "Grid" qualifier no longer fits once the layout isn't a grid). This is the shared slot-diffing logic both `FilterChips` and the new `FilterRecap` (Task 2) need — defining it once avoids duplicating the active/pending diff logic.
- `FilterChips.tsx` imports both from their new locations; no behavior change.

### Task 2 — Build `FilterRecap` and wire it into the desktop sidebar + mobile sheet
**Files**: `frontend/src/components/FilterRecap.tsx` (new), `frontend/src/app/page.tsx` (edit), `frontend/src/components/FilterChips.tsx` (edit)

- New component, props mirroring today's `FilterChipsProps` (`activeFilters`, `pendingFilters`, `hasPendingChanges`, `onPendingChange`, `onClearAll`, `onApplyPendingFilters`, `onDiscardPendingFilters`).
- Renders `buildFilterSlots(activeFilters, pendingFilters)` as one inline `flex flex-wrap` flow. Per slot: the active chip (or the default-label placeholder if only a pending value exists) followed by an arrow icon + pending chip, only when `hasPendingChanges && slot.pendingChip != null`; otherwise just the active chip.
- Below the chip flow: Apply filters / Discard / Clear all buttons (same handlers as today, relocated).
- Wrapper uses `sticky top-0 z-10 bg-background` (or the panel's actual surface color) so it stays pinned while the controls below it scroll, in both the sidebar and the sheet's `overflow-y-auto` container.
- Wire into `page.tsx`'s `<aside>`: `<FilterRecap /> → <IntentInput /> → <FilterPanel />` (recap first).
- Wire into `FilterChips.tsx`'s `SheetContent` with the same order, above `IntentInput`.
- The existing main-area chips in `FilterChips.tsx` are untouched in this task — purely additive.

### Task 3 — Remove the desktop chip grid from the main area
**Files**: `frontend/src/components/FilterChips.tsx`

- Delete the `hidden lg:grid …` block (current lines ~199–249) — now redundant, `FilterRecap` in the sidebar covers it.

### Task 4 — Simplify the mobile main-area block
**Files**: `frontend/src/components/FilterChips.tsx`, `frontend/src/app/page.tsx`

- Drop the mobile pending-chips row (Apply/Discard) — covered inside the sheet's `FilterRecap` now.
- Keep only: active chips (existing `✕` → `onPendingChange` behavior unchanged) + "Clear all" + the "Filters" sheet trigger button.
- `FilterChipsProps` drops `onApplyPendingFilters`/`onDiscardPendingFilters` (no longer used here); update the call site in `page.tsx` to stop passing them.

### Task 5 — Filters button label reflects pending-change count
**Files**: `frontend/src/components/FilterChips.tsx`

- Derive a pending-change count from the slots already available (`buildFilterSlots(activeFilters, pendingFilters)` filtered to slots where the active/pending chip labels differ) — computed locally in `FilterChips`, no new prop from `page.tsx` needed.
- Button label becomes `Filters (${count} pending changes)` when `count > 0`, else plain `Filters`.

### Task 6 — Chip removal / Clear all (mobile) also opens the filter sheet
**Files**: `frontend/src/components/FilterChips.tsx`

- Lift the `Sheet`'s `open` state: `const [sheetOpen, setSheetOpen] = useState(false)`, pass `open={sheetOpen} onOpenChange={setSheetOpen}` to `<Sheet>` (controlled-mode supported — `Sheet` spreads props straight onto Base UI's `Dialog.Root`).
- Mobile active-chip `onRemove` and "Clear all" handlers additionally call `setSheetOpen(true)` after their existing `onPendingChange`/`onClearAll` call.

## TODO list

- [x] **Task 1** — Extract `FilterChip.tsx` and `lib/filterSlots.ts` from `FilterChips.tsx`; no behavior change
- [x] **Task 2** — Build `FilterRecap.tsx`; wire into desktop `<aside>` and mobile `SheetContent` (additive)
- [x] **Task 3** — Remove the desktop chip grid from `FilterChips.tsx`
- [x] **Task 4** — Simplify mobile main-area block to active-only chips + Clear all + Filters button (props kept — still forwarded to `FilterRecap` in the sheet)
- [x] **Task 5** — Filters button label shows pending-change count (extracted shared `isSlotPending` helper to `lib/filterSlots.ts` for DRY)
- [x] **Task 6** — Chip removal / Clear all (mobile) also opens the filter sheet (controlled `Sheet` state)
