# Stage 2 Frontend — Task Plan

## Status legend
- `[ ]` todo
- `[~]` in progress
- `[x]` done

---

## Tasks

| # | Status | Description | Files |
|---|---|---|---|
| 0 | `[x]` | Bootstrap: `pnpm create next-app frontend` + install shadcn/ui | CLI only |
| 1 | `[x]` | API layer | `src/lib/types.ts`, `src/lib/api.ts` |
| 2 | `[x]` | BigNumber component | `src/components/BigNumber.tsx` |
| 3 | `[x]` | MovieList component | `src/components/MovieList.tsx` |
| 4 | `[~]` | Filter components | `src/components/FilterChips.tsx`, `src/components/FilterPanel.tsx` |
| 5 | `[ ]` | IntentInput placeholder | `src/components/IntentInput.tsx` |
| 6 | `[ ]` | Main page + layout | `src/app/page.tsx`, `src/app/layout.tsx` |

**Strict mode**: each task follows code → **wait for human approval** → next task.

---

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15, App Router |
| Language | TypeScript |
| Package manager | pnpm |
| Styling | Tailwind CSS (via shadcn setup) |
| Component library | shadcn/ui |
| Charts | None — mini score distribution uses CSS bars |

shadcn components to install: `button`, `badge`, `slider`, `input`, `select`, `sheet`, `card`

---

## Layout

**Mobile (single column):**
```
App header
IntentInput (Stage 3 placeholder — disabled)
FilterChips (always visible) + Sheet → FilterPanel
BigNumber: Total films
BigNumber: Avg score  +  mini CSS score bars (children slot)
BigNumber: Total votes
MovieList (≤50 films, sorted by average_rating desc)
```

**Desktop (lg+, 2-column sidebar layout):**
```
Left sidebar (280px): IntentInput + FilterPanel (always visible)
Main area: FilterChips + BigNumber row + MovieList
```

---

## Key Component Interfaces

```tsx
// BigNumber.tsx
type BigNumberType = 'total_count' | 'average_rating' | 'total_votes'
interface BigNumberProps {
  type: BigNumberType          // drives label, color, icon (future)
  value: string | number
  children?: React.ReactNode   // e.g. mini score bars for average_rating
}

// MovieList.tsx
interface MovieListProps {
  movies: MovieOut[]   // sorted by parent (average_rating desc)
  loading: boolean
}

// FilterChips.tsx + FilterPanel.tsx
interface FiltersProps {
  filters: FilterParams
  onChange: (filters: FilterParams) => void
}

// IntentInput.tsx — no props (Stage 3 placeholder, always disabled)
```

---

## Filters (FilterParams fields)
- `genre` → `<Select>` with hardcoded IMDb genre list
- `year_min` / `year_max` → two `<Input type="number">`
- `rating_min` → `<Slider>` (1–10, step 0.1)
- `votes_min` → `<Select>` with presets: 1K, 5K, 10K, 50K, 100K, 500K

Active filters always shown as removable chips above the Big Numbers (both mobile and desktop).

---

## Verification (after Task 6)

```bash
# Terminal 1
cd api && uv run uvicorn app.main:app --reload

# Terminal 2
cd frontend && pnpm dev
```

Open `http://localhost:3000` and verify:
- Big Numbers load from API
- Mini score bars render inside Avg score card
- Movie list appears sorted by rating
- Filter chips update on filter changes
- Mobile layout: single column, Sheet opens on "Adjust filters"
- Desktop layout: sidebar always visible
