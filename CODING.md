# Coding Conventions

Guidance for AI coding assistants and human contributors.

Each section starts with anti-patterns to avoid, then lists good practices to reinforce.

---

## General coding rules

### Meaningful names over abbreviations and type names

No abbreviations or single-letter names outside loop counters (`i`, `idx`). Names must describe domain meaning, not type or role: `activeUsers` not `userList`, `pendingIds` not `data` or `temp`.

**Why:** A type-derived or role-less name forces the reader to trace the code to understand what the value represents.

```ts
// ❌
const d = getUsers()
const arr = statuses.map(s => s.id)

// ✅
const users = getUsers()
const statusIds = statuses.map(status => status.id)
```

---

### Named variables over inline computation

Extract any non-trivial expression to a named variable before using it in a condition, a return value, or a template — arithmetic, boolean guards, and data-shaping chains alike.

**Why:** A name states intent; an inline expression forces the reader to evaluate the logic to understand what the value *represents*.

```ts
// ❌
if (!isLoading && data && data.items.length > 0) { render(data) }

// ✅
const hasResults = !isLoading && data != null && data.items.length > 0
if (hasResults) { render(data) }
```

---

### Single definition for shared utilities (DRY)

A utility function must be defined **once** in a shared module and imported wherever needed. Never copy-paste a helper into multiple files.

**Why:** Multiple copies drift apart silently; there is no canonical version to fix or update.

```ts
// ❌ — formatDate defined independently in module A and module B

// ✅
export function formatDate(d: Date): string { ... }  // shared/utils
import { formatDate } from "./shared/utils"           // every consumer
```

---

### Functional iteration over generic loops

Prefer `filter`, `map`, `reduce`, and similar methods over `for`/`while` loops when the loop's sole purpose is filtering, transforming, or accumulating a collection.

**Why:** Functional methods name the operation, making the intent of the loop apparent without reading its body.

```ts
// ❌ — a for loop whose intent (filtering) is only clear after reading the body
const activeUsers: User[] = []
for (const user of users) {
  if (user.isActive) activeUsers.push(user)
}

// ✅ — intent is stated by the method name
const activeUsers = users.filter(user => user.isActive)
```

---

### Shared data contracts in a dedicated module

The single source of truth for every shared data shape lives in one dedicated module (`types.ts`, `schemas.py`, etc.). Never inline a shape definition inside a function or handler.

**Why:** One definition means one place to update when the contract changes.

```ts
// ❌
function processOrder(order: { id: string; total: number }) { ... }

// ✅
import type { Order } from "./types"
function processOrder(order: Order) { ... }
```

---

### Module-level constants over magic values

Place named constants at the top of the module, outside any function. Never embed literal values that carry domain meaning inside logic.

**Why:** A name communicates meaning; a bare number does not.

```ts
// ❌
function clamp(n: number) { return Math.min(Math.max(n, 0), 100) }

// ✅
const MIN_SCORE = 0
const MAX_SCORE = 100
function clamp(n: number) { return Math.min(Math.max(n, MIN_SCORE), MAX_SCORE) }
```

---

### Explicit state layers

When code manages both committed and in-progress (pending) state, name each layer explicitly — including a dirty flag. Never use a single variable that sometimes represents committed and sometimes represents pending values.

**Why:** A variable that means different things at different times leads to bugs where pending values are accidentally applied or committed values discarded.

```ts
// ❌
let filters = getActiveFilters()
filters = applyEdit(filters, change)  // is this committed or just pending?

// ✅
let activeFilters = getActiveFilters()    // committed, drives queries
let pendingFilters = { ...activeFilters } // in-progress edit, not yet applied
let isDirty = false
```

---

## Frontend (React / TypeScript)

### Components in their own files

Every React component with its own props or render logic belongs in its own file under `components/`. Do not define components inside a page file.

**Why:** A component buried in `page.tsx` is invisible to a developer or AI agent scanning the `components/` folder.

```tsx
// ❌ — SmallWidget defined and consumed in page.tsx

// ✅ — components/SmallWidget.tsx exports it; page.tsx imports it
import { SmallWidget } from "@/components/SmallWidget"
```

> Exception: a component so trivial it is a single JSX expression (no props, no logic) may be inlined as a local `const`.

**Component size limit:** A component body should stay under ~150 lines. When it grows beyond that, split along these lines:
- Data-fetching and state logic → custom hook (`useXyz`)
- Pure calculation or formatting → plain function in `lib/` or `utils/`
- Repeated JSX subtree → sub-component in `components/`

```tsx
// ❌ — mixes data-fetching, filtering logic, and markup in one body
export function MovieList() {
  const [movies, setMovies] = useState<MovieOut[]>([])
  useEffect(() => { fetch('/api/movies').then(...).then(setMovies) }, [])
  const filtered = movies.filter(m => m.rating > 7).sort(...)
  // ... 80 more lines
}

// ✅ — data logic extracted; component body is concise
export function MovieList() {
  const { movies, isLoading } = useMovies()
  const topRatedMovies = useTopRated(movies)
}
```

---

### Centralised API module

All `fetch` calls live in `lib/api.ts`. Components never call `fetch()` directly.

**Why:** A single module is the only place to update base URLs, headers, or error handling.

```ts
// ❌
const res = await fetch(`/api/movies?genre=${genre}`)

// ✅
import { fetchMovies } from "@/lib/api"
const movies = await fetchMovies({ genre })
```
