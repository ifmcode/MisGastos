---
name: Documentation and Ticket Workflow
description: Ticket status flow, roadmap Current Focus, project memory sessions and README updates for MisGastos. Use when opening, updating or closing a ticket, or when documenting a decision or session.
---

# Documentation and ticket workflow

`docs/project/development-notes/roadmap.md` is the single source of truth for V1
scope, phase order and the current ticket. `project-memory.md` holds decisions,
business rules and session history.

## Opening a ticket

1. Ticket frontmatter: `Status: 🚧 In progress`.
2. Roadmap **Current Focus**: milestone, phase, current ticket and status.
3. Keep `Next` pointing at the following ticket.

## Closing a ticket (only when everything is covered)

1. Tick every requirement and acceptance criterion; add an `Implemented` section
   with the delivered files and behavior.
2. `Status: ✅ Done (DD/MM/YYYY)`.
3. Rename the file to `[DONE] TICKET-0NN-...md` and the H1 to
   `# [DONE] TICKET-0NN - ...`, keeping the id.
4. Roadmap: tick the phase checkbox and update **Current Focus** (`Last completed`,
   `Next`, status).
5. `README.md`: features, structure, scripts and roadmap status.
6. `project-memory.md`: one row in the session history plus refreshed
   "Current State" bullets when behavior changed.

Never rename or mark done while a requirement, acceptance criterion or
verification command is open.

## Ticket format

```md
# TICKET-0NN - Title

**Type:** Feature / UX / Workflow / Tooling
**Priority:** High
**Status:** ⏳ Pending | 🚧 In progress | ✅ Done (DD/MM/YYYY)
**Related:** PM-0NN; other tickets
**Sprint:** <phase or track>

## Description
## Requirements      (checkboxes)
## Acceptance Criteria (checkboxes)
## Technical Notes
## Validation Plan
```

## Development notes

One file per decision: `docs/project/development-notes/YYYY-MM-DD-<slug>.md`, with
context, decision, alternatives, consequences, phase mapping and open questions.
Link it from the roadmap and from the ticket's `Implemented` section.

## README

Spanish, user-facing. Keep the feature list, project tree, scripts table,
testing section and roadmap checkboxes aligned with reality. Add the new docs to
the documentation index when a note or guideline is created.

## Session memory

Add a row to the session history table: `| DD/MM/YYYY | Change | Notes |`. The
notes should state the decision, the files that carry it, the verification
results and the next ticket. Record durable decisions in **Key Decisions**, not
only in the session row.

## Consistency audit

Before finishing a docs change, grep for the renamed/deleted path and fix every
reference in `docs/`, `AGENTS.md` and `README.md`. Check that dates, test counts
and coverage numbers come from a real run, not from memory.
