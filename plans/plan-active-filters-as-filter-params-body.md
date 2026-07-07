# Plan: Type activeFilters as FilterParamsBody

## Design decisions

- No new types introduced — `FilterParamsBody` already exists in `types.ts` and is the right shape.
- `sort_by` / `sort_direction` remain as separate `useState` entries (unchanged).
- `limit` and `offset` are promoted to the same pattern: separate `useState` entries alongside `sortBy`/`sortDirection`, assembled into the fetch call together.
- The inline `FilterParams` assembly in the `useEffect` becomes: `{ ...activeFilters, sort_by: sortBy, sort_direction: sortDirection, limit, offset }`.

## Path

- Narrow the `activeFilters` state type from `FilterParams` to `FilterParamsBody`.
- Remove the destructuring workaround that stripped `limit`/`offset` out of `activeFilters` to produce `activeFiltersBody`.
- Promote `limit` and `offset` to explicit `useState` entries, mirroring `sortBy`/`sortDirection`.
- Update `FilterChips` to accept `activeFilters` as `FilterParamsBody` (its `buildGridSlots` and props interface only ever used the `FilterParamsBody` fields anyway).

## TODO list

**`frontend/src/app/page.tsx`**

- [x] Change `useState<FilterParams>({})` → `useState<FilterParamsBody>({})` for `activeFilters`
- [x] Add `const [limit, setLimit] = useState<number | undefined>(undefined)` and `const [offset, setOffset] = useState<number>(0)` alongside the existing sort state
- [x] Remove `const { limit: _limit, offset: _offset, ...activeFiltersBody } = activeFilters`
- [x] Replace every reference to `activeFiltersBody` with `activeFilters` (in `displayFilters`, `updatePending`, `clearAll`, `discardPendingFilters`)
- [x] Update the `useEffect` `movieParams` assembly to include `limit` and `offset`: `{ ...activeFilters, sort_by: sortBy, sort_direction: sortDirection, limit, offset }`
- [x] Add `limit` and `offset` to the `useEffect` dependency array
- [x] Remove `FilterParams` from the import if unused (it may still be needed for the `movieParams` type annotation)

**`frontend/src/components/FilterChips.tsx`**

- [x] Change `buildGridSlots(active: FilterParams, ...)` parameter type → `FilterParamsBody`
- [x] Change `FilterChipsProps.activeFilters: FilterParams` → `FilterParamsBody`
- [x] Remove `FilterParams` from the import line
