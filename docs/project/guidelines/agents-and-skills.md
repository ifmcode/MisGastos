# Guidelines: Agents and Skills (OpenCode)

> Project-specific OpenCode configuration for MisGastos. Source of truth for the
> agent inventory, the routing table, the permission model and how to evolve it.
> Created in TICKET-024. Related: `AGENTS.md`, `roadmap.md`, `project-memory.md`,
> `docs/project/testing/test-guide.md`.

## 1. Purpose

Recurring work is delegated to a specialist with the right instructions,
permissions and validation checklist, so a new session does not re-explain the
project. **Predictability over catalog size.**

**Anti-sprawl rule:** a new agent or skill is created only when a task type has
repeated at least twice, or when a permission boundary is needed (for example a
read-only reviewer). Related work stays inside an existing agent otherwise.

## 2. Inventory of recurring work

| Task type | Frequency | Owner today |
|---|---|---|
| Screen, form, modal, list, style or accessibility change | Every UX ticket | `mobile-ui` |
| Firestore document, repository, mapper, operation or rules change | Every data ticket | `firebase-data` |
| Money, balance, transfer, split or settlement logic | Balances of every money ticket | `firebase-data` implemented, `reviewer` verified |
| Unit tests for services, repositories, schemas and utils | Every business-logic ticket | Same owner as the code, with the `jest-testing` skill |
| Design spike, data-model or sync decision, phase breakdown | Phase 4 and future epics | `architect` |
| Ticket status, roadmap, memory, notes, README | Every ticket open/close | `docs-writer` |
| Pre-merge correctness and regression review | Before closing or merging | `reviewer` |
| Copy extraction and translation namespaces | Every UI ticket | `mobile-ui` |
| Firestore rules/index deployment | Manual, by the user | Never an agent |
| Offline-first implementation | Roadmap Phase 7 | `architect` then `firebase-data` |

## 3. Agents

Referenced from TICKET-024. The suggested `test-engineer` agent was **not**
created: tests follow the code owner plus the `jest-testing` skill, which avoids
a fifth UI/data agent with overlapping triggers.

**Model policy:** no agent pins `model`, so every subagent inherits the parent
session model. This keeps the config portable across machines and providers. To
pin one, add `model: provider/model#variant` to that agent's frontmatter and
document the reason in this file.

| Agent | Mode | Purpose and triggers | Writes |
|---|---|---|---|
| `architect` | subagent | Design spikes, ADRs, trade-offs, task breakdowns | `docs/project/development-notes/**` only |
| `mobile-ui` | subagent | Screens, components, styles, theming, a11y, i18n copy | application source, **not** rules/indexes |
| `firebase-data` | subagent | Repositories, operations, mappers, schemas, services, rules | application source + `firestore.rules` |
| `reviewer` | subagent | Read-only review of correctness, regressions, money invariants | nothing (no edit, no shell) |
| `docs-writer` | subagent | Tickets, roadmap, memory, notes, README, `AGENTS.md` | `docs/**`, `README.md`, `AGENTS.md` |

Files: `.opencode/agents/<id>.md`. Markdown body = system prompt; frontmatter =
`description`, `mode`, `steps`, `color`, `permissions`.

## 4. Skills

Files: `.opencode/skills/<id>/SKILL.md` (directory form, so references and scripts
live next to the workflow). IDs are path-derived and case-sensitive.

| Skill | When it loads | Key content |
|---|---|---|
| `misgastos-feature` | Any feature change | Layer map, build order, 150-line/composition rules, `scripts/verify.ps1` |
| `firestore-rules` | Collection, document shape, rules or transaction change | Ownership helpers, rules pattern, transaction invariants, indexes |
| `money-and-balances` | Amounts, balances, totals, splits | `roundMoney`, signed helpers, 8 monetary invariants, required tests |
| `react-native-ui` | Any screen or component | Theme hooks, shared component inventory, a11y, dark mode, copy |
| `jest-testing` | Tests, fixtures, coverage failures | 90% scope, file naming, mocks, error-branch coverage, commands |
| `docs-ticket` | Ticket open/close, decisions, session notes | Status flow, close checklist, ticket format, memory/README rules |

Deferred by design: `offline-sync` is created when Phase 7 starts, so it can be
written against real code instead of an accepted design only.

## 5. Routing table

| Task | Agent | Skills | Expected output |
|---|---|---|---|
| New screen, component or UX polish | `mobile-ui` | `react-native-ui`, `misgastos-feature` | Components + styles + copy, verification output |
| New form, modal, detail or empty/loading/error state | `mobile-ui` | `react-native-ui`, `misgastos-feature` | Same, reusing `shared/components` |
| Firestore collection, repository or mapper | `firebase-data` | `firestore-rules`, `misgastos-feature` | Interface + implementation + unit tests |
| Rules, index or ownership change | `firebase-data` | `firestore-rules` | Rules diff + deploy note for the user |
| Money, transfer or balance logic | `firebase-data`, then `reviewer` | `money-and-balances`, `jest-testing` | Operation + invariant tests + review findings |
| Tests and coverage for existing logic | Code owner agent | `jest-testing` | Tests + coverage numbers |
| Design spike, ADR or phase breakdown | `architect` | `misgastos-feature`, `firestore-rules` when data is involved | Note in `development-notes/session-notes/`, open questions |
| Ticket open/close, roadmap, memory, README | `docs-writer` | `docs-ticket` | Updated ticket, roadmap, memory row, README |
| Pre-merge / pre-close review | `reviewer` | `money-and-balances` when money is involved | Severity-ordered findings + verdict |
| Offline-first implementation (Phase 7) | `architect` then `firebase-data` | `offline-sync` (to be created), `firestore-rules` | Accepted design, then implementation |

## 6. Permission model

Permissions are ordered `{ action, resource, effect }` rules; **the last match
wins**, so broad rules come first and exceptions after.

| Boundary | Rule | Why |
|---|---|---|
| Reviewer cannot edit | `edit: * → deny` | Review must not change the code it judges |
| Reviewer cannot run commands | `shell: * → deny` | No destructive commands; caller runs the suite |
| Reviewer cannot reach the web | `webfetch`/`websearch → deny` | Review is local and reproducible |
| Architect cannot touch source | `edit: * → deny`, then `docs/project/development-notes/** → allow` | Decisions are docs; implementation is a separate agent |
| Architect shell | deny all except `git status/diff/log`, `npx tsc --noEmit`, `npx expo lint` | Read-only verification only |
| Docs writer cannot touch source | `edit: * → deny`, then `docs/**`, `README.md`, `AGENTS.md → allow` | Docs-only changes |
| Docs writer shell | deny all except `git status`/`git diff` | No builds, no destructive commands |
| UI cannot change security config | `firestore.rules` and `firestore.indexes.json → deny` | Security artifacts belong to `firebase-data` |
| No nested delegation | `subagent: * → deny` on every agent | The primary agent owns orchestration |
| Commits stay manual | `git commit*`/`git push* → ask` on writing agents | Matches the project rule: never commit unless asked |
| Deployment stays manual | `firebase deploy*` → deny | Rules/index deploys are user actions |
| Destructive deletes | `rm -rf *` → deny | No recursive deletions from an agent |

`hidden` is **not** used: permissions, not visibility, enforce the boundary.

## 7. How delegation works

- Agent selection is description-driven plus explicit user requests; there is no
  automatic task router. Trigger words live in each `description`.
- Routing is **mandatory** for the primary agent: `AGENTS.md` and
  `docs/project/prompts/initial-session-prompt.md` require it to state the chosen
  agent and skills in one line before implementing, load the matching skill with
  the `skill` tool, and delegate unless the edit is trivial (one file, a typo).
- The **primary** agent delegates, because custom agents cannot launch subagents.
  Chains in the routing table (`firebase-data` then `reviewer`) are run by the
  primary in sequence.
- Subagents start with fresh context. The delegation prompt must include the
  ticket id, the files in scope, the decision already taken and the expected
  output; the agent files and skills carry the project rules.
- The primary agent reviews every subagent result and runs the full verification
  itself; delegation never replaces `tsc`/`lint`/`jest`/`check:copy`.
- Configuration reloads live; no restart is needed after editing `.opencode/`.

## 8. Adding, updating and retiring

**Add an agent** — only for a repeated task or a new permission boundary:
1. Confirm the rule in §1 and that no existing agent covers it.
2. Create `.opencode/agents/<id>.md` with `description` (trigger words), `mode: subagent`,
   ordered `permissions`, optional `steps`/`color`, and a system prompt that points
   to the read-first docs, the boundary and the deliverable.
3. Add it to §3 and §5 here, and to the roster in `AGENTS.md`.

**Add a skill** — only for a repeated workflow:
1. Create `.opencode/skills/<id>/SKILL.md` with `name` and a description that
   states when to use it. Put scripts/references beside it.
2. Reference existing docs instead of copying them; keep it under ~120 lines.
3. Add it to §4 and §5.

**Update** — change the file, then re-check that the routing table still matches
the real folders. Permission changes need a review of the whole ordered list.
Update the tables here in the same change.

**Retire** — delete the file, remove every reference here, `AGENTS.md` and the
delegation prompts, and note the removal in the `project-memory.md` session row.
Retire when a task stops repeating or when two agents' triggers overlap.

## 9. Validation runs (TICKET-024)

| Run | Agent | Scope | Result |
|---|---|---|---|
| A | `reviewer` | Read-only audit of the transfer-history detail flow (TICKET-039) | Verdict `approve with nits`; 8 findings (3 minor, 5 nit), no file modified, no shell command attempted |
| B | `docs-writer` | Docs-only update of `AGENTS.md` + `README.md` for the new setup | 2 files changed, source untouched, no invented metrics |
| C | `architect` | Triage of run A findings against roadmap Current Focus | Split recommendation: fix findings 1, 3, 6, 8 in a small cleanup ticket before TICKET-007; queue 2, 5, 7 with triggers; no file written |

All runs confirm: the primary agent can delegate, the read-only agent produces
results without touching source, and the docs agent stays inside `docs/**`,
`README.md` and `AGENTS.md`.

Run A findings are product follow-ups and are **not** implemented in TICKET-024,
which is workflow-only. Run C proposed a cleanup ticket (not created yet):
findings 3 (stale form error in the read-only detail) and 1 (list replaced by a
spinner after deleting from the detail) must not be deferred because the social
screens will reuse these hooks; 6 and 8 ride along; 2 (shared dialog composition)
waits for the third entry point, 5 (iOS modal hand-off) needs a device check and
7 (dead `edit` branch) waits for a third `TransferItem` caller.

## 10. Known limitations

- There is no automatic router; a wrong agent choice is fixed by a better
  `description`, not by configuration.
- OpenCode does not enforce permission-aware "ask" prompts for every shell
  pattern; deny rules are the only hard guarantee.
- Rules/index deployment and Firebase console steps remain manual.
- `login`, `verify-email` and `modal` features have no dedicated agent on purpose:
  they are covered by `mobile-ui` + `features/auth` conventions.
