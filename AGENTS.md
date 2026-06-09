# AGENTS.md

Guidance for AI coding assistants (Claude Code, Cursor, Copilot, etc.) working on this repository.


## Workflow & Agent-Human Interaction Guidelines

This project supports two AI execution modes: Standard and Strict Maintainer (Reason->Act, strict code/test separation).

**Initialization Check:**
When starting a new session, or when the user asks to implement a new feature or non-trivial change, proactively ask ONE brief question before starting:
> "Do you want me to use the Maintainer's Strict Workflow (Reason->Act, strict code/test separation) for this task, or standard execution?"

- Do not ask this question for trivial tasks (e.g., fixing a typo, explaining code).
- If the user chooses "Standard", proceed normally with the domain rules defined in this file.
- If the user chooses "Strict", use the following human-agent interaction directives :
  - **use the agentic ReAct (Reason->Act) workflow** :
    1. reason/plan
    2. wait for human approval of the plan
    3. transform the plan into a TODO list
    4. act by implementing the tasks of the TODO list
    note: of course, developments and brainstorming with the human may impact the TODO list; in such a case, inform the human and ask for its approval
  - **clear separation of coding and testing tasks**: imperatively maintain strict separation between code and test changes, with Human-in-the-Loop (HITL) checkpoints. Two acceptable orderings:
    - **TDD (preferred)**: Update tests → wait for human approval → write implementation → wait for human approval → run tests (they should pass)
    - **Code-first**: Change code → wait for human approval → run tests → surface failures to human → propose test updates → wait for human approval → apply test fixes
  - **For multi-file changes**: If a task requires changes to more than 3 source files, stop and break it into smaller tasks first.
  - **Commits**: Never commit changes; the project maintainer handles this.

## Project Overview

TODO

## Architecture

**Language**: TODO

**Source files**:
TODO

## Common Commands

TODO

## Implementation Details

TODO

## Testing

The project includes a comprehensive test suite. See `TESTING.md` for detailed testing conventions, organization, and guidance for all contributors.
