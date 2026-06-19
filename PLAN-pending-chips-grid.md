# PLAN-pending-chips-grid.md

## Design decisions

- Two distinct layouts: mobile (< 1024px, `lg:`) keeps flex-wrap unchanged; desktop (≥ 1024px) uses CSS grid for vertical chip alignment
- A grid column exists only when at least one of (active, pending) has a value for that filter dimension; zero-value dimensions produce no column
- When a column exists but one side has no value, show a greyed default label ("All genres", "Any year", "Any rating", "Any votes") instead of a chip
- Buttons are right-aligned via `ml-auto` on mobile and via a `1fr` actions column on desktop
- On mobile, the Sheet (Filters) trigger migrates to the pending row when a pending state exists
- Phone landscape (< 1024px) is treated as mobile; tablet landscape (≥ 1024px) as large screen — consistent with existing `lg:` breakpoint usage in `page.tsx`

## Path

1. **Mobile**: minimal changes — wrap buttons with `ml-auto`, move Sheet trigger to pending row when pending state exists
2. **Desktop**: replace static flex rows with a CSS grid; same-filter chips aligned vertically; greyed placeholders fill empty cells; columns absent when neither row has a value

## Plan

**File**: `frontend/src/components/FilterChips.tsx`

### C1 — add `GridSlot` + `buildGridSlots`

New interface alongside existing `Chip`:
```ts
interface GridSlot {
  key: string
  defaultLabel: string
  activeChip: Chip | null
  pendingChip: Chip | null
}
```

New function `buildGridSlots(active: FilterParams, pending: FilterParamsBody): GridSlot[]`:
- Iterates 5 dimensions in order: genres_or, genres_and, year, rating_min, votes_min
- Computes activeChip and pendingChip for each dimension independently
- Includes slot only when `activeChip || pendingChip`
- Default labels: "All genres", "All genres", "Any year", "Any rating", "Any votes"
- Chip `clear` values computed by spreading the respective full filter object with the dimension cleared

### C2 — mobile layout update (`lg:hidden`)

Existing flex-wrap rows, two changes:
- Wrap buttons (`Apply filters` + `Discard` / `Clear all`) in `<div className="ml-auto flex items-center gap-2">` per row
- Sheet trigger: render inside pending row when `hasPendingChanges`; render inside active row when `!hasPendingChanges`

### C3 — desktop grid layout (`hidden lg:grid`)

Container: `<div className="hidden lg:grid lg:items-center lg:gap-x-3 lg:gap-y-1.5">` with inline style `gridTemplateColumns: \`repeat(${slots.length}, auto) 1fr\``

Each row renders `slots.length + 1` cells:
- Per slot: chip element (pending or active style) if value exists, else `<span className="text-xs text-muted-foreground italic">{slot.defaultLabel}</span>`
- Last cell (actions): `<div className="flex justify-end gap-2">`

Pending row: only when `hasPendingChanges`; pending chip style `border-primary bg-primary/10 text-primary`
Active row: always; active chip style `border-border bg-secondary text-secondary-foreground`

No Sheet trigger in desktop layout (already `lg:hidden` on the trigger).

## TODO list

- [x] **C1** — add `GridSlot` interface + `buildGridSlots` function
- [x] **C2** — mobile layout: `ml-auto` button wrappers + Sheet trigger migration
- [x] **C3** — desktop layout: grid rendering using `buildGridSlots`
