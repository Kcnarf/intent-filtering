---
name: skill-verifying-test
description: Verify that every testing convention from skill-testing has been applied. Use this after any testing session — writing, reviewing, or modifying tests — before marking a task done. Invoke proactively when the user says "done", "finished", or asks for a review of recent test changes.
---

# Test Convention Verification

Audit the current test changes against every rule in skill-testing and report violations.

## Step 1 — Load the rules

Read `.claude/commands/skill-testing.md`. That file is the single source of truth for all convention rules. Extract every named rule from it.

## Step 2 — Determine scope

Default: test files changed since main.

```bash
git diff main --name-only -- 'api/tests/**'
```

If the user specifies files, check those instead.

## Step 3 — Run the test suite

Run the tests and record pass/fail and any output:

```bash
cd api && uv run pytest
```

## Step 4 — Check each file

Read each file in scope fully. For every rule from Step 1, note each violation with its exact line number.

## Step 5 — Produce the report

Use exactly this structure:

```
## Test Verification

### Summary
- ✅ Tests pass
- ❌ <rule name from skill-testing> (N violations)
- ✅ <rule name from skill-testing>
- ...one line per rule, in the order they appear in skill-testing...

### Violations

#### Tests

<raw pytest output>

#### api/tests/test_routers.py

- `api/tests/test_routers.py:45` — **[Rule name]** What is wrong and what to do instead
- `api/tests/test_routers.py:89` — **[Rule name]** What is wrong and what to do instead

#### api/tests/test_intent.py

- `api/tests/test_intent.py:23` — **[Rule name]** What is wrong and what to do instead
```

`Tests pass` always appears first in the Summary. Convention rules (from skill-testing) fill the rest, in their original order.

In the Violations section: test failures come first, followed by file-grouped convention violations. Omit any section with no violations.

If no violations are found:

```
## Test Verification — All clear ✅

All checks passed across N files checked.
```
