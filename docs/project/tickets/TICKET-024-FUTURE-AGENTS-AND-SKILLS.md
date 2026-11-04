# TICKET-024 - Future Epic: Agents and Skills Specialization

**Type:** Workflow / Tooling  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** PM-024; all implementation tickets  
**Sprint:** Developer Experience / Continuous  

## Description
Define project-specific OpenCode agents and skills so recurring work is routed to a specialist with the right instructions, permissions and validation checklist. The goal is predictable execution, not a large catalog of agents.

## Requirements
- [ ] Inventory the recurring task types in this project
- [ ] Define the first 3-4 agents with `description`, `mode`, model and permissions
- [ ] Create one skill per repeated workflow, with references and scripts where useful
- [ ] Add a routing table: task type -> agent -> skills -> expected output
- [ ] Restrict sensitive agents with explicit permissions
- [ ] Validate the setup with at least two real tickets
- [ ] Document how to add, update and retire an agent or skill
- [ ] Record the decisions in `AGENTS.md` and `project-memory.md`
- [ ] Avoid agent sprawl: only create a new agent when a task repeats

## Acceptance Criteria
- [ ] Every common task type has a clear owner agent and skill
- [ ] The primary agent can delegate to the correct subagent
- [ ] A read-only reviewer cannot edit files or run destructive commands
- [ ] A docs writer cannot modify application source by accident
- [ ] New work can be assigned predictably without re-explaining the project
- [ ] At least two workflows run end-to-end with the new setup
- [ ] The configuration is discoverable and documented in the repository

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
