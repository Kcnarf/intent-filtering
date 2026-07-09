---
name: skill-verifying-code
description: Verify that every coding convention from skill-coding has been applied. Use this after any coding session — writing, reviewing, or refactoring — before marking a task done. Covers naming, structure, TypeScript safety, React patterns, DRY, and the before-finishing checklist. Invoke proactively when the user says "done", "finished", or asks for a review of recent changes.
---

# Code Convention Verification

Audit the current changes against every rule in skill-coding and report violations.

## Step 1 — Load the rules

Read `.claude/commands/skill-coding.md`. That file is the single source of truth for all convention rules. Extract every named rule from it.

## Step 2 — Determine scope

Default: all files changed since main.

```bash
git diff main --name-only
```

If the user names exact files, check those instead.

If the user describes scope in words instead (e.g. "the entire frontend", "everything under src/api"), resolve it yourself: first find the `.gitignore` files that apply to the target path — the root `.gitignore` plus any nested `.gitignore` found under that path (e.g. `frontend/.gitignore`) — and exclude every directory and file pattern they list before building the file list. Do not walk the tree with a bare `find`/`ls`; that pulls in `node_modules`, `dist`, `build`, `.next`, and similar directories.

Before reading any files, count the resolved scope, however it was determined. If it exceeds 50 files, stop and use `AskUserQuestion` to show the count and confirm with the user before proceeding.

## Step 3 — Run tooling checks

Run the project's lint and typecheck commands and record pass/fail and any output:

```bash
npm run lint
npx tsc --noEmit
```

Use whatever commands are configured in the project's `package.json` if different.

## Step 4 — Check each file

Read each file in scope fully. For every rule from Step 1, note each violation with its exact line number. Also check for leftover `console.log` statements.

## Step 5 — Produce the report

Use exactly this structure:

```
## Code Verification

### Summary
- ✅ Lint
- ❌ Typecheck (2 errors)
- ✅ <rule name from skill-coding>
- ❌ <rule name from skill-coding> (N violations)
- ...one line per rule, in the order they appear in skill-coding...
- ✅ No console.log

### Violations

#### Lint

<raw lint output>

#### Typecheck

<raw typecheck output>

#### src/path/to/File.tsx

- `src/path/to/File.tsx:45` — **[Rule name]** What is wrong and what to do instead
- `src/path/to/File.tsx:89` — **[Rule name]** What is wrong and what to do instead

#### src/path/to/other.ts

- `src/path/to/other.ts:23` — **[Rule name]** What is wrong and what to do instead
```

Lint and Typecheck always appear first in the Summary. `No console.log` always appears last. Convention rules (from skill-coding) fill the middle, in their original order.

In the Violations section: tooling failures come first (Lint, then Typecheck), followed by file-grouped convention and console.log violations. Omit any section with no violations.

If no violations are found:

```
## Code Verification — All clear ✅

All checks passed across N files checked.
```
