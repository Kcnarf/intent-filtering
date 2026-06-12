# Testing Conventions

This document outlines testing conventions. All contributors should follow these patterns when writing or modifying tests.

The documents starts with generic rules and guidelines, then provides project-specific ones.

## Test Organization Structure

Group tests by API endpoints, function or parameter, not by outcome (error vs. success). Each parameter gets its own test group containing both the "provided" and "omitted" cases.

**Structure example:**
```
describe('first-function-name'):
  describe('first-parameter-name'):
    test('should accept value with expected syntax')
    test('should throw an error if vlue value is syntaxically invalid')
    test('should call sub-method with correct value when provided')
    test('should not call sub-method when parameter omitted')
    ...
  describe('second-parameter-name')
  ...
describe('second-function-name')
...
```

**Why:** Makes it easy to understand all aspects of a single parameter; improves test discoverability.

**Group examples:**
- `describe('model-name/POST endpoint', ...)`
- `describe('function foo()', ...)`

## Test Description Format

Every test description must start with "should" to clearly state expected behavior.

**Examples:**
- ✅ "should call split() with the correct separator" / ❌ "split() is called with the correct separator"
- ✅ "should not call split() when input is empty" / ❌ "split() not called when input is empty"

**Why:** Creates consistent, behavior-focused documentation; makes expected behavior immediately clear.

## Subset Operation Assertions

When testing any operation that returns a subset of items — filtering, paginating, querying by relationship, batch side-effects, permission checks, etc. — assert the **exact result set**, not just properties of the returned items.

**Recommended pattern — count first, then set:**

```python
# ✅ count assertion: fast break with a readable mismatch message
assert len(results) == 2
# ✅ set assertion: catches wrong items even when count is right
assert {m["id"] for m in results} == {"id_1", "id_2"}

# ❌ attribute check — only verifies returned items look right;
#    a broken operation returning too many (or zero) items can still pass
assert all(criterion(m) for m in results)
```

The `len()` assertion fails immediately with a clear count mismatch ("expected 2, got 5") before the set comparison even runs. The set comparison then catches wrong-item cases where the count is accidentally correct. Together they are unambiguous.

Attribute-presence checks only verify that returned results satisfy the criterion. They do not catch a broken operation that returns extra items (if those extra items also satisfy the criterion) or returns nothing at all (vacuously true for an empty list).

**When no unique identifier is available**, the count assertion becomes the primary guard; follow it with the most stable distinguishing field (name, title, slug, composite key):
```python
assert len(results) == 2
assert {r["name"] for r in results} == {"Alice", "Bob"}
```

**If ordering also matters**, add a separate assertion for it — do not use a sorted list comparison as a substitute for set equality:
```python
assert {m["id"] for m in results} == {"id_1", "id_2"}  # correct items
assert [m["id"] for m in results] == ["id_1", "id_2"]  # correct order
```

**Why:** Set comparison simultaneously verifies inclusion (expected items were returned) and exclusion (unexpected items were not). Per-item attribute checks verify only one direction — a subtle false positive that is easy to miss.

### Companion rule: test data must include excluded items

A subset operation test is only meaningful if the test dataset contains **at least one item that should NOT appear in the result**. Without an excluded item, a completely broken operation that returns everything still passes all assertions.

```python
# ❌ bad — every item satisfies genres_or=["Action"], so a broken filter passes
Movie(genres="Action"), Movie(genres="Action,Comedy")

# ✅ good — Drama must be excluded, so a broken filter is caught
Movie(genres="Action"), Movie(genres="Action,Comedy"), Movie(genres="Drama")
```

## Unit Tests

### Unit Tests: Code Responsibility

Unit tests focus exclusively on your code's behavior, not on the behavior of functions it calls.

**Core principle:** Only test the behavior of the function under test. Any function your code calls—whether from a library or another part of your codebase—should be assumed to work correctly and should not be tested.

**Why:** Focuses on the responsibility of your function; avoids redundant testing of dependencies; tests remain valid when dependencies change or internal functions are refactored.

**Good examples:**
- Test that you called `str.split()` with the correct separator ✅ (your responsibility: passing correct args)
- Test that you correctly trimmed and lowercased the string before passing it on ✅ (your responsibility: transformation logic)
- Test that you correctly filtered the array before passing it to the aggregation function ✅ (your responsibility: filtering logic)

**Bad examples:**
- Test that `str.split()` correctly split the string ❌ (standard library's responsibility)
- Test that `str.toLowerCase()` correctly lowercased the string ❌ (standard library's responsibility)
- Test that `arr.filter()` correctly filtered the array ❌ (standard library's responsibility)

**The key question:** Before writing any test, ask: "Who is responsible for this behavior — my code, or a dependency?" If the answer is a dependency, don't test it.

### Unit Tests: Parameter Passing Verification

Use stubs to directly verify that called methods are called with correct parameters. Do not infer parameter passing from output behavior.

**Why:** Tests the implementation contract explicitly; catches parameter mismatches without relying on behavior inference; enables verification that methods are NOT called when parameters are omitted.

### Unit Tests: Edge Case Testing

For error conditions, test both the failure case AND the success boundary case.

**Example - Empty array:**
- ✅ "should throw error for empty array" (error case)
- ✅ "should not throw error for array with a single element" (success boundary)

**Why:** Ensures error checks are precise; prevents false positives; documents what inputs ARE allowed.

## Integration Tests

TODO : section defined collaboratively during Stage 1 (backend development), based on the actual API endpoints and test strategy.

## Project's Test Stack

### Backend

TODO: which framework
Backend test files live in the `./api/test/` directory.

### Frontend

Frontend will not be tested

**Rationale:** backend will be well tested in order to guarantee correct API responses (i.e. data retrieval). Frontend is the presentation layer of the app, and UI issues will quickly be spotted if any. Moreover, it's an experimentation project, so relying on correct backend responses seems required but experimentations on frontend does not need this security harness.

## Project's Test Scope: for now, Integration Tests of the backend only

This project currently focuses on **integration test of the backend API**, in order to check API responds the right way.

**If unit tests are ever added:** They would follow the patterns defined in [Unit Tests: Code Responsibility](#unit-tests-code-responsibility) above.

## Running Tests

```bash
TODO: command to run tests
```