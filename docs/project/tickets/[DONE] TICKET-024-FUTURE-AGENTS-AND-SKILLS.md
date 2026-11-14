# [DONE] TICKET-024 - Future Epic: Agents and Skills Specialization

**Type:** Workflow / Tooling  
**Priority:** High  
**Status:** ✅ Done (14/11/2026)  
**Related:** PM-024; all implementation tickets  
**Sprint:** Developer Experience / Continuous  

## Description
Define project-specific OpenCode agents and skills so recurring work is routed to a specialist with the right instructions, permissions and validation checklist. The goal is predictable execution, not a large catalog of agents.

## Requirements
- [x] Inventory the recurring task types in this project
- [x] Define the first 3-4 agents with `description`, `mode`, model and permissions
- [x] Create one skill per repeated workflow, with references and scripts where useful
- [x] Add a routing table: task type -> agent -> skills -> expected output
- [x] Restrict sensitive agents with explicit permissions
- [x] Validate the setup with at least two real tickets
- [x] Document how to add, update and retire an agent or skill
- [x] Record the decisions in `AGENTS.md` and `project-memory.md`
- [x] Avoid agent sprawl: only create a new agent when a task repeats

## Acceptance Criteria
- [x] Every common task type has a clear owner agent and skill
- [x] The primary agent can delegate to the correct subagent
- [x] A read-only reviewer cannot edit files or run destructive commands
- [x] A docs writer cannot modify application source by accident
- [x] New work can be assigned predictably without re-explaining the project
- [x] At least two workflows run end-to-end with the new setup
- [x] The configuration is discoverable and documented in the repository

## Technical Notes
- OpenCode V2 discovers project agents in `.opencode/agents/<name>.md` and skills in `.opencode/skills/<skill-id>/SKILL.md`. Global equivalents live under `~/.config/opencode/`.
- Agent Markdown frontmatter supports `description`, `mode` (`primary`, `subagent`, `all`), `model`, `permissions`, `steps`, `hidden`, `color` and `disabled`. The Markdown body becomes the system prompt.
- Skills use path-derived IDs. A directory-based `SKILL.md` is recommended so scripts and references stay next to the workflow. Add a clear `description` so the skill is discoverable.
- Agent selection is driven by descriptions and explicit user requests, not by an automatic task router. Write descriptions with concrete trigger words.
- Permissions use ordered `{ action, resource, effect }` rules, with the last match winning. Use `deny` for reviewer edits/shell and restrict docs agents to `docs/**`.
- Suggested initial agents:
  - `architect`: architecture, ADRs, task breakdown, no production edits.
  - `mobile-ui`: React Native screens, components, styles and accessibility.
  - `firebase-data`: Firestore repositories, rules, transactions and data contracts.
  - `reviewer`: read-only correctness and regression review.
  - `docs-writer`: tickets, plan, roadmap and development notes.
- Suggested initial skills:
  - `misgastos-feature`: end-to-end feature workflow and file-size/architecture rules.
  - `firestore-rules`: ownership, shared-data and rules-test patterns.
  - `money-and-balances`: rounding, wallet balances, splits and settlements.
  - `react-native-ui`: themed styles, accessibility and dark-mode checks.
  - `jest-testing`: colocated tests, fixtures and verification commands.
  - `docs-ticket`: ticket format, plan updates and memory notes.
- Add `offline-sync` only after TICKET-023 has an accepted architecture.
- Keep a single `opencode.json(c)` for shared config if needed, and preserve existing user settings when editing it.
- References:
  - `https://opencode.ai/v2/docs/agents`
  - `https://opencode.ai/v2/docs/skills`

## Suggested Routing
| Task | Agent | Skills |
|---|---|---|
| New screen or component | `mobile-ui` | `react-native-ui`, `misgastos-feature` |
| Firestore model, rules or transaction | `firebase-data` | `firestore-rules`, `misgastos-feature` |
| Money, splits or balances | `firebase-data` + `reviewer` | `money-and-balances`, `jest-testing` |
| Tests and coverage | `test-engineer` (or `mobile-ui`) | `jest-testing` |
| Plan, ticket or memory update | `docs-writer` | `docs-ticket` |
| Code review before merge | `reviewer` | none |
| Offline sync work | `architect` then `firebase-data` | `offline-sync` after TICKET-023 |

## Validation Plan
- Use one UI ticket (for example TICKET-020) to validate delegation to `mobile-ui`.
- Use one architecture/documentation ticket (for example the TICKET-023 design spike) to validate `architect` and `docs-writer`.
- Review both results and adjust descriptions, permissions and skills before adding more agents.

## Implemented

**Configuration (`.opencode/`, committed and discovered live):**

- `.opencode/agents/architect.md` — `subagent`, 30 steps, `edit` denied except `docs/project/development-notes/**`, shell limited to `git status|diff|log` and `tsc`/`lint`. Produces ADRs; no production edits.
- `.opencode/agents/mobile-ui.md` — `subagent`, application source, denies `firestore.rules` and `firestore.indexes.json`, `git commit|push` require approval, `rm -rf`/`firebase deploy` denied.
- `.opencode/agents/firebase-data.md` — `subagent`, repositories/operations/mappers/schemas/services/rules, deployment denied, commit/push require approval.
- `.opencode/agents/reviewer.md` — `subagent`, 40 steps, **`edit` and `shell` denied** plus `webfetch`/`websearch` denied; read-only review with severity-ordered findings.
- `.opencode/agents/docs-writer.md` — `subagent`, 30 steps, `edit` denied except `docs/**`, `README.md` and `AGENTS.md`; shell limited to `git status|diff`.
- Every custom agent denies the `subagent` action, so the primary agent owns orchestration and nested delegation cannot appear.

**Skills (one directory per repeated workflow):**

- `misgastos-feature` — layer map, build order, composition/file-size rules and `scripts/verify.ps1` (tsc → lint → jest → copy audit, stops on first failure).
- `firestore-rules` — ownership helpers, per-collection contract, rules pattern, `runTransaction` invariants and index rules.
- `money-and-balances` — `roundMoney`, signed transaction/transfer helpers and eight monetary invariants.
- `react-native-ui` — theme hooks, shared component inventory, accessibility, dark mode, translated copy and web fallbacks.
- `jest-testing` — 90% business-logic scope, colocated naming, fixtures/fakes, mock boundaries and triage.
- `docs-ticket` — status flow, close checklist, ticket format, memory/README rules and consistency audit.

**Decisions (documented in `guidelines/agents-and-skills.md`):**

- Five agents (the requested 3-4 plus `architect`), no `test-engineer`: tests follow the code owner with the `jest-testing` skill to avoid overlapping triggers.
- No pinned `model` in any frontmatter: subagents inherit the parent session model, keeping the config portable across machines and providers.
- No `opencode.json(c)` was added; agents carry their own permissions, so no shared config can overwrite user settings.
- `offline-sync` is deferred until roadmap Phase 7 starts, so it is written against real code.
- `hidden` is not used: permissions, not visibility, enforce boundaries.

**Documentation:** `docs/project/guidelines/agents-and-skills.md` (inventory, roster, routing table, permission model, add/update/retire workflow, validation record, limitations), a new `## Agents and skills` section in `AGENTS.md`, `.opencode/` and the guideline link in `README.md`, and the decisions in `project-memory.md`. Routing is mandatory: `AGENTS.md` (new **Routing and delegation** section) and `docs/project/prompts/initial-session-prompt.md` (§4) require the primary agent to announce agent + skills, load the skill, delegate unless the edit is trivial, and verify the result itself.

**Validation runs (two real workflows, end-to-end):**

| Run | Agent | Scope | Outcome |
|---|---|---|---|
| A | `reviewer` | Read-only audit of TICKET-039 (transfer detail from `/transfers`) | Returned verdict `approve with nits` and 8 structured findings (3 minor, 5 nit) on the implemented flow, with file/line references, without modifying a file or running a command |
| B | `docs-writer` | Documentation update for this setup | Updated `AGENTS.md` and `README.md`, stayed inside its allowed paths, introduced no metrics or dates |
| C | `architect` | Triage of the 8 findings against roadmap Current Focus | Recommended a small cleanup ticket before TICKET-007 for findings 1, 3, 6 and 8, with the rest queued behind explicit triggers; wrote no file |

Run A surfaced product follow-ups (wallet reload spinner, duplicated transfer-dialog wiring, stale form error in the detail, iOS modal hand-off, `deleteDialog` punctuation, dead label branch). They are out of this workflow ticket's scope; run C's proposed cleanup ticket is recorded in `guidelines/agents-and-skills.md` §9 and has not been created yet.
