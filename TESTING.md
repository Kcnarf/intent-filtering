# Testing Conventions

This document outlines testing conventions for the project. All contributors should follow these patterns when writing or modifying tests.

## Test Stack

## Backend

TODO: which framework
Backend test files live in the `./api/test/` directory.

## Frontend

Frontend will not be tested

**Rationale:** backend will be well tested in order to guarantee correct API responses (i.e. data retrieval). Frontend is the presentation layer of the app, and UI issues will quickly be spotted if any. Moreover, it's an experimentation project, so relying on correct backend responses seems required but experimentations on frontend does not need this security harness.

## Scope: for now, Integration Tests of the backend only

This project currently focuses on **integration test of the backend API**, in order to check API responds the right way.

**If unit tests are ever added:** They would follow the patterns defined in [Unit Tests: Code Responsability](#unit-tests-code-responsibility) below.

## Unit Tests: Code Responsibility

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

## Integration Tests: Code Responsibility

TODO

## Test Description Format

Every test description must start with "should" to clearly state expected behavior.

**Examples:**
- ✅ "should call split() with the correct separator"
- ✅ "should not call split() when input is empty"
- ❌ "split() is called with the correct separator"
- ❌ "split() not called when input is empty"

**Why:** Creates consistent, behavior-focused documentation; makes expected behavior immediately clear.

## Test Organization Structure

Group tests by function or parameter, not by outcome (error vs. success). Each parameter gets its own test group containing both the "provided" and "omitted" cases.

**Structure:**
```
describe('parameter-name'):
  test('should call method with correct value when provided')
  test('should not call method when parameter omitted')
```

**Why:** Makes it easy to understand all aspects of a single parameter; improves test discoverability.

**Example groups:**
- `test('separator parameter', ...)`
- `test('limit parameter', ...)`
- `test('case-sensitivity option', ...)`

## Parameter Passing Verification

Use stubs to directly verify that called methods are called with correct parameters. Do not infer parameter passing from output behavior.

**Why:** Tests the implementation contract explicitly; catches parameter mismatches without relying on behavior inference; enables verification that methods are NOT called when parameters are omitted.

## Edge Case Testing

For error conditions, test both the failure case AND the success boundary case.

**Example - Empty array:**
- ✅ "should throw error for empty array" (error case)
- ✅ "should not throw error for array with a single element" (success boundary)

**Why:** Ensures error checks are precise; prevents false positives; documents what inputs ARE allowed.

## Running Tests

```bash
TODO: command to run tests
```
