---
name: next-todo
description: Find and plan the next open TODO item in AnkiLM. Loads mandatory context (CLAUDE.md, ARCHITECTURE.md, DECISIONS.md), identifies the first unchecked task in TODO.md, and creates an implementation plan. Use when starting a new work session or after completing a task.
---

# next-todo

Plans the next open task from `TODO.md`. Always loads mandatory context first so the plan is grounded in the current architecture and decisions.

## Steps (follow in order)

### 1. Load mandatory context

Read these files before doing anything else:

```
CLAUDE.md
docs/ARCHITECTURE.md
docs/DECISIONS.md
src/backend/.env.example
```

### 2. Find the next open task

Open `TODO.md` and scan for the first `- [ ]` item that is **not** blocked by an incomplete prerequisite phase.

- Phase prerequisites are listed in each phase header. Respect them.
- Prefer the lowest-numbered unblocked phase.
- Within a phase, take the first unchecked item.

Report:
- Which task you selected (exact text)
- Which phase it belongs to
- Why it is unblocked (prerequisites met or none)

### 3. Enter plan mode and plan the task

Call `EnterPlanMode`, then produce a concrete implementation plan:

- List every file that needs to be created or changed (with paths relative to repo root)
- For each file: what specifically changes and why
- Call out any ADR that is relevant (from `docs/DECISIONS.md`)
- Flag any item that requires a manual step by the user (👤) or terraform (🌍) — do not plan those as Claude actions
- End with the exact `TODO.md` checkbox(es) that will be checked off when done

Do **not** start implementing. The plan is for user review and approval first.
