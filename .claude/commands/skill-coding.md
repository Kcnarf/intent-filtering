---
name: skill-coding
description: Project coding conventions for TypeScript/React and Python/FastAPI. Invoke this before any implementation session — writing, reviewing, or refactoring code in this project, regardless of language or file.
---

# Coding Conventions

Guidance for AI coding assistants and human contributors.

Each section starts with anti-patterns to avoid, then lists good practices to reinforce.

> Code examples throughout are in TypeScript, but every rule applies to all languages used in this project (TypeScript/React frontend and Python/FastAPI backend).

---

## General coding rules

### Meaningful names over abbreviations and type names

No abbreviations or single-letter names. Names must describe domain meaning, not type or role: `activeUsers` not `userList`, `pendingIds` not `data` or `temp`.

**Exception:** Domain-standard abbreviations like 'Id' (identifier) are acceptable. They're universally understood and appear in standard library names (`userId`, `recordId`).

**Why:** A type-derived or role-less name forces the reader to trace the code to understand what the value represents.

```ts
// ❌ — generic names, no meaning
const d = getUsers()
const arr = statuses.map(s => s.id)

// ✅ — meaningful names; 'Id' is a domain-standard abbreviation
const users = getUsers()
const userIds = users.map(user => user.id)
const userId = 123
const userName = 'John'
```

---

### Meaningful names for iterables

When iterating over collections, avoid generic abbreviations like `i`, `e`, or `elem`. Use the singular form of the collection name for element variables, and postfix 'I' (capital I) to the singular name for index variables.

**Why:** A meaningful name reveals what the loop variable represents without requiring the reader to trace back to the collection or loop context.

```ts
// ❌
for (let i = 0; i < names.length; i++) { console.log(names[i]) }
for (const elem of names) { console.log(elem) }

// ✅
for (let nameI = 0; nameI < names.length; nameI++) { console.log(names[nameI]) }
for (const name of names) { console.log(name) }
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

> Note: use `!= null` (loose), not `!== null`, when the value can be either `null` or `undefined` — a strict check against only one of them lets the other slip through and crash on `.items`.

---

### Single definition for shared utilities (DRY)

A utility function — or any non-trivial logic, not just helpers labeled "utility" — must be defined **once** in a shared module and imported wherever needed. Never copy-paste logic into multiple files.

Before writing a new function or component, search the codebase (grep/glob) for an existing one with similar purpose or name. Extend or import it rather than duplicating.

**Why:** Multiple copies drift apart silently; there is no canonical version to fix or update. Checking first is cheaper than de-duplicating later.

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

### Lifecycle ownership (aka Encapsulation / DDAU)

A variable's full lifecycle — initial value, update logic, and state transitions — is owned by exactly **one** object (component, class, or module). Others may **observe** the current value and **signal intent** by calling dedicated functions, but they never compute the next state themselves.

The owner exposes two kinds of APIs:

- **Complex-logic handlers** (`handleVarUpdate(intent)` or domain-named equivalents like `handleSortByChange(field)`): own the state transition logic. Use when updating this variable requires computing derived values, checking invariants, or coordinating with other state.
- **Simple setters** (`setVar(value)`): direct assignment. Use for trivial updates that need no logic — just setting a flag or storing a value directly.

Both are public, owned by the owner. Callers never mutate directly or compute the next state themselves.

**Why:** When multiple objects each compute a next value, the transition logic is spread across collaborators and drifts silently. Centralising all mutations in one owner — whether via handler or setter — makes the state machine clear and testable. Testing becomes straightforward: a handler tests the logic, a setter tests direct updates.

> Derived state (e.g., `visibleItems = items.filter(...)`) is recomputed whenever its source changes; no handler or setter needed. Define it once, close to the source.

**Signals the smell:** a collaborator computes the next value before calling the owner, or mutates a variable it does not own.

```ts
// ❌ — caller computes and mutates directly
function onColumnClick(field: SortByField) {
  const newDir = computeNewSortDir(field);
  sortBy = field;   // direct mutation from outside
  sortDir = newDir; // direct mutation from outside
}

// ✅ — owner owns complex logic via handler
function handleSortByChange(newField: SortByField) {
  const newDir = computeNewSortDir(newField); // logic owned here
  sortBy = newField
  sortDir = newDir
}
// ✅ — owner exposes simple updates via setter
function setSortDir(newDir: SortByField) {
  sortDir = newDir // simple setter for direct assignment
}

// ✅ — caller signals intent, owner decides
function onColumnClick(field: SortByField) {
  handleSortByChange(field) // "I want to sort by this field" — handler decides the direction
}
```

**Applies across ecosystems:** React/Ember call this DDAU (Data Down, Actions Up); OOP languages call it encapsulation. The principle is the same: mutations live in the owner, callers send actions.

---

### Early returns for preconditions

When a function has preconditions — a required value, a permission check, a validation rule — apply two steps:

1. **Extract** — pull every precondition check out of the happy path and place it before it, handling each failure immediately with a return or throw. Never nest the happy path inside a chain of guard `if` blocks.
2. **Arrange** — among the extracted checks, keep independent ones flat (one `if` per check). When a check only makes sense after an earlier one passes (e.g. `user.profile.preferences` requires `user.profile` to exist first), chain or nest that part instead: flattening interdependent checks makes them *look* like unrelated rules, when they're really one connected concept.

**Why:** Nested guards force the reader to hold all prior conditions in mind before reaching the actual logic — extraction (step 1) removes that burden. But collapsing every extracted check into an identical flat `if` regardless of dependency (skipping step 2) hides real structure: the reader can't tell two checks are related unless the code shows it.

**Scope:** This rule applies to **guard clauses only** — checks that exist solely to reject invalid input or state. A check is a guard clause if removing it would still let the function run correctly on valid input; it exists purely to reject bad input/state. A check is algorithm logic if it produces different valid outputs depending on the branch (e.g. `if (items.length === 0) return []` is behavior, not rejection) — nested `if` blocks expressing algorithm logic or business rules are unaffected by this rule.

```ts
// ❌ Bad — neither step applied: every precondition wraps the happy path
function greet(user: User | null) {
  if (user) {
    if (user.isActive) {
      if (user.profile && user.profile.preferences) {
        if (user.isFirstVisit) {
          return `Welcome, ${user.name}!`
        } else {
          return `Hello again, ${user.name}!`
        }
      } else {
        throw new NotFoundError("Preferences not found")
      }
    } else {
      throw new ForbiddenError("User is inactive")
    }
  } else {
    throw new NotFoundError("User not found")
  }
}

// ✅ Better — step 1 (extract) applied: every check pulled to the top as an early return/throw.
// step 2 (arrange) skipped: `profile` and `preferences` are flattened as if independent from `user`,
// hiding that each one can only be checked once the previous one passed
function greet(user: User | null) {
  if (!user) throw new NotFoundError("User not found")
  if (!user.isActive) throw new ForbiddenError("User is inactive")
  if (!user.profile) throw new NotFoundError("Profile not found")
  if (!user.profile.preferences) throw new NotFoundError("Preferences not found")

  if (user.isFirstVisit) {
    return `Welcome, ${user.name}!`
  } else {
    return `Hello again, ${user.name}!`
  }
}

// ✅✅ Even better — step 1 (extract) still applied, plus step 2 (arrange):
// independent checks stay flat; the interdependent user → profile → preferences
// chain is nested (else-if) as one connected decision
function greet(user: User | null) {
  if (!user) throw new NotFoundError("User not found")             // independent — flat
  if (!user.isActive) throw new ForbiddenError("User is inactive")  // independent — flat

  if (!user.profile) throw new NotFoundError("Profile not found")                     // interdependent —
  else if (!user.profile.preferences) throw new NotFoundError("Preferences not found") // chained, not flattened

  if (user.isFirstVisit) {                    // business logic — nesting is intentional, not a guard
    return `Welcome, ${user.name}!`
  } else {
    return `Hello again, ${user.name}!`
  }
}
```

---

## Project specific coding rules

---

### TypeScript - No `any`, no non-null assertions

Never use `any` to silence a type error — use `unknown` and narrow it, or fix the underlying type. Never use the non-null assertion operator (`!`) to bypass a null check — handle the `null`/`undefined` case explicitly.

**Why:** Both are ways of telling the type checker to stop checking, which removes the safety net at exactly the point it's most likely needed.

```ts
// ❌
function parse(input: any) { return input.value }
const user = getUser()!

// ✅
function parse(input: unknown) {
  if (typeof input === "object" && input !== null && "value" in input) {
    return input.value
  }
  throw new Error("invalid input")
}
const user = getUser()
if (!user) throw new Error("user not found")
```

### React - Components in their own files

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

### React - No logic inside JSX

Keep the JSX returned by a component declarative. Extract any filtering, sorting, or conditional computation to a named variable above the `return`, even if the component otherwise stays under the size limit.

**Why:** Staying under the line limit doesn't help if the return statement itself is doing the thinking — a reader (or agent) scanning the render output should see *what* is shown, not have to evaluate logic to find out.

```tsx
// ❌ — logic embedded directly in JSX
return (
  <div>
    {items.filter(i => i.active && i.score > threshold).map(i => (
      <Card key={i.id} highlighted={i.score > 90 && !i.archived} />
    ))}
  </div>
)

// ✅ — logic named above the return, JSX stays declarative
const visibleItems = items.filter(i => i.active && i.score > threshold)
return (
  <div>
    {visibleItems.map(i => <Card key={i.id} highlighted={isHighlighted(i)} />)}
  </div>
)
```

---

### React - Centralised API module

All `fetch` calls live in `lib/api.ts`. Components never call `fetch()` directly.

**Why:** A single module is the only place to update base URLs, headers, or error handling.

```ts
// ❌
const res = await fetch(`/api/movies?genre=${genre}`)

// ✅
import { fetchMovies } from "@/lib/api"
const movies = await fetchMovies({ genre })
```

