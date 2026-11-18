# Roadmap - MisGastos

> Development guide: V1 scope, phase order, ticket order and the current ticket.
> **Last reviewed:** 18/11/2026

## Scope of this file
- This file answers **what to build next and in which order**, plus the rules for doing it.
- It is **not** a development diary: implementation detail, delivered files and decisions belong to `project-memory.md` and to the dated notes in `session-notes/`.
- Every ticket lists its closed/open state and, for closed work, the closing date. The *how* is never described here.
- **Before starting a ticket:** update **Current Focus** and set the ticket `Status` to `🚧 In progress`.
- **When the ticket is done:** update **Current Focus**, tick the phase item below, refresh `README.md` and add the session entry to `project-memory.md` (see **Rules**).

## Product Vision
A personal finance manager (wallets, movements, transfers and dashboard) merged with Splitwise-style shared finances (friends, groups, shared expenses, balances and settlements). **V1.0 is everything defined in this roadmap**; the MVP was the first milestone, not the release.

## Current Focus
- **Milestone:** M3 - Social and platform
- **Phase:** 5 - Social vertical slice
- **Current ticket:** TICKET-047 - in-app notification inbox
- **Status:** ⏳ Pending
- **Last completed:** TICKET-051 - Mandatory shared expense category and no hidden default (17/11/2026)
- **Carried over:** TICKET-023 epic is 🚧 In progress — phases 2-7 run in roadmap Phase 7
- **Queued:** TICKET-055 and TICKET-056 in Phase 5.3 after the notification inbox; TICKET-008 in Phase 6
- **Next:** TICKET-047 - in-app notification inbox
- **Tickets:** `docs/project/tickets/` (completed files use the `[DONE] ` prefix)

## V1.0 Scope
| Milestone | Scope | Phases | Status |
|---|---|---|---|
| **M1 - Core personal finance (MVP)** | Auth, wallets, movements, transfers, dashboard and history | 0, 2 | ✅ Done |
| **M2 - Personal finance complete** | UX follow-up, i18n and shared components | 3 | ✅ Done |
| **M3 - Social and platform** | Architecture spike, friends, shared expenses, balances, groups and group history | 4-6 | 🚧 In progress |
| **M4 - Offline and retention** | Offline-first implementation, budgets, statistics, search, export and final polish | 7-8 | ⏳ Pending |

**V1.0 ships when M1-M4 are complete.** Phase 1 (foundation) is a completed cross-cutting quality track; its coverage gate stays enforced. Anything outside these phases is post-V1.

## Phase Overview
| Phase | Theme | Status |
|---|---|---|
| 0 | Organization | ✅ Done |
| 1 | Foundation | ✅ Done |
| 2 | MVP core | ✅ Done |
| 3 | Personal finance complete | ✅ Done |
| 4 | Architecture and workflow spike | ✅ Done |
| 5 | Social vertical slice | 🚧 In progress |
| 6 | Groups | ⏳ Queued |
| 7 | Offline-first implementation | ⏳ Queued |
| 8 | Retention and final polish | ⏳ Queued |

> Subphase numbers group related work; they are not a strict execution order. **Current Focus** is the execution order.
>
> The former `PM-xxx` feature ids remain as aliases in each ticket's `Related` field; ticket ids are the canonical reference.
>
> Tickets created before the 12/11/2026 consolidation may reference the old plan phases: A → 3, A.1 → 3.1, A.2 → 3.2, A.3 → 3.3, A.4 → 3.4, A.5 → 3.5, A.6 → 3.6, B → 4, C → 5, D → 6, E → 7, F → 8.

## Phase 0: Organization (COMPLETED)
- [x] Create folder structure
- [x] Create memory, guidelines, roadmap and tickets
- [x] Define the MVP merging Expense Manager + Splitwise

## Phase 1: Foundation (COMPLETED)
- [x] Create `features/` and `shared/` structure
- [x] Migrate auth to `features/auth` (repo + service) without breaking the flow
- [x] Resolve the base UI kit in `shared/components` (TICKET-038)
- [x] Add common types (`Result<T>`, etc.) in `shared/types/common.types.ts`
- [x] Configure test coverage >= 90% for business logic in `jest.config.js`

## Phase 2: MVP core (COMPLETED)
- [x] TICKET-000 Setup, auth and project organization
- [x] TICKET-001 Wallets
- [x] TICKET-002 Transactions + history + filters
- [x] TICKET-003 Transfers + dashboard

## Phase 3: Personal finance complete (COMPLETED)

### 3.1 Personal finance UX follow-up (COMPLETED)
- [x] TICKET-025 Movement detail view with edit/delete actions ✅ 11/11/2026
- [x] TICKET-026 Transfer history from accounts ✅ 11/11/2026
- [x] TICKET-027 Home recent movements and transfers ✅ 11/11/2026
- [x] TICKET-028 Compact category selector ✅ 12/11/2026
- [x] TICKET-029 Compact wallet selector and missing wallet fix ✅ 12/11/2026

### 3.2 Category ordering (COMPLETED)
- [x] TICKET-030 Reorder categories and reuse the order in every picker ✅ 12/11/2026

### 3.3 Internationalization (COMPLETED)
- [x] TICKET-031 Per-feature translation namespaces and Spanish/English selector in Settings ✅ 12/11/2026

### 3.4 Wallet transfer entry (COMPLETED)
- [x] TICKET-032 Move **Transferir** from the dashboard header to the **Carteras** tab ✅ 12/11/2026

### 3.5 Dashboard recent data and detail views (COMPLETED)
- [x] TICKET-033 Recent-transfers cap/freshness and **Ver todos** ✅ 13/11/2026
- [x] TICKET-034 Movement detail from a recent movement ✅ 13/11/2026
- [x] TICKET-035 Transfer detail view with edit/delete ✅ 13/11/2026
- [x] TICKET-036 Transfer detail from a recent transfer ✅ 13/11/2026
- [x] TICKET-039 Transfer detail from the transfer history ✅ 14/11/2026

### 3.6 Shared component extraction (COMPLETED)
- [x] TICKET-037 Shared loading/error/empty states, form blocks and list rows in `shared/components` ✅ 13/11/2026

### 3.7 Earlier post-MVP polish (COMPLETED)
- [x] TICKET-004 Categories management
- [x] TICKET-005 Date picker UX
- [x] TICKET-014 Dark mode polish + Settings toggle ✅ 09/11/2026
- [x] TICKET-018 Wallet management ✅ 10/11/2026
- [x] TICKET-020 Inline auth errors
- [x] TICKET-021 Email verification on signup
- [x] TICKET-022 Discoverable edit/delete actions

### 3.8 Profile and preferred currency (COMPLETED)
- [x] TICKET-006 Profile editing and a preferred-currency selector ✅ 14/11/2026

## Phase 4: Architecture and workflow spike (COMPLETED)
- [x] TICKET-023 (design spike only): SQLite + outbox, idempotency and conflict policy decided before groups ✅ 14/11/2026
- [x] TICKET-024: the 5 project agents and 6 skills defined with routing, permissions and validation runs ✅ 14/11/2026
- [x] Record the decisions in `session-notes/` and `guidelines/agents-and-skills.md`
- This phase runs before Phase 5; the full offline implementation is Phase 7

## Phase 5: Social vertical slice (IN PROGRESS)
- [x] TICKET-007: friends and requests ✅ 15/11/2026
- [x] Minimal subset of TICKET-009: 1:1 shared expense ✅ 15/11/2026 (ticket stays open for the group requirements)

### 5.1 Social navigation and shared-expense UX
- [x] TICKET-041: Social tab shell, add-friend screen and pending requests ✅ 16/11/2026
- [x] TICKET-042: friend detail screen with shared expenses ✅ 16/11/2026
- [x] TICKET-043: shared expense detail screen ✅ 16/11/2026
- [x] TICKET-044: shared expense wallet and linked personal movement ✅ 16/11/2026
- [x] TICKET-045: movements FAB create menu ✅ 16/11/2026
- [x] TICKET-048: mandatory wallet for viewer-paid shared expenses ✅ 17/11/2026
- [x] TICKET-049: shared-expense link feedback and category reset ✅ 17/11/2026
- [x] TICKET-050: shared-expense save feedback and category picker ✅ 17/11/2026
- [x] TICKET-051: mandatory shared-expense category and no hidden default ✅ 17/11/2026

### 5.2 1:1 settlement and notifications
- [ ] TICKET-046: 1:1 debt settlement with bilateral confirmation
- [ ] TICKET-047: in-app notification inbox with pending/viewed sections and the in-app banner
- The balance between two people already ships with TICKET-009; TICKET-046 replaces the former "minimal subset of TICKET-010" settlement line.
- Validate with 3-5 real users
- Do not build a friends list without shared expenses; it does not validate the product

### 5.3 Shared-expense form refinement
- [ ] TICKET-055: optional wallet registration in shared expenses with a configurable default
- [ ] TICKET-056: compact currency field with **Cambiar** and the live remaining amount for the fixed split

## Phase 6: Groups (QUEUED)
- [ ] TICKET-008: create groups (consumes the Social → Tus grupos shell from TICKET-041)
- [ ] Full TICKET-009: the group requirements still open after the 1:1 subset (group membership and payer validation, group currency, expense in the group detail)
- [ ] TICKET-010: group balances and settlements (reuse the TICKET-046 settlement state machine, wallet movements and notification events)
- [ ] TICKET-011: group history
- Constraint from the Phase 4 spike: shared expenses and settlements are append-only ledger entries folded by a shared pure function, so offline group movements work without a rewrite

## Phase 7: Offline-first implementation (QUEUED)
- [ ] Full TICKET-023 (design accepted in Phase 4)
  - [ ] Foundations: local SQLite DB, client-generated ids, `revision`/`deletedAt`/`appliedMutations` and rules
  - [ ] Local read cache for personal data and offline banner
  - [ ] Offline write queue for expenses, incomes and transfers with local balance derivation
  - [ ] Sync engine, retry/backoff, exactly-once and conflict UI
  - [ ] Offline group/friend movements (after Phase 6)
  - [ ] Offline UX, observability, account purge on logout/switch and web decision
- If offline is a launch requirement, move this phase before Phase 6
- Do not retrofit offline after groups without the Phase 4 decisions; the current Firestore transaction-based balance model may need to change

## Phase 8: Retention and final polish (QUEUED)
- [ ] TICKET-012 budgets, TICKET-016 statistics, TICKET-015 advanced search, TICKET-013 export of wallets, movements, transfers, categories and account settings (excluding shared/group data), TICKET-017 history grouping and TICKET-019 dashboard quick add
- [ ] TICKET-040 Storybook component catalog (developer tooling; can move earlier if the social UI needs it)
- Then invest in final visual polish with real social screens

## Post-V1 backlog (NOT in V1 scope)
- [ ] TICKET-052 push notifications for background and closed app
- [ ] TICKET-053 account data import
- [ ] TICKET-054 Google Drive backup and restore
- These are intentionally outside V1.0 scope, listed so their order and dependencies stay visible, and they start only after V1 ships.

## Ordering Rules
- **Recommended:** 0-3 → 4 → 5 → 6 → 7 → 8
- **Validate the Splitwise side first:** complete Phase 3, then 4 → 5 → 6
- **Offline-first launch:** complete Phase 3, then 4 → 7 → 5 → 6
- **Polished personal-finance first:** complete Phases 3 and 8, delay social
- **Never** implement full offline after groups without the Phase 4 spike

## Rules
- This roadmap is the single source of truth for V1 scope, phase order and the current ticket
- **Before starting:** set the ticket `Status` to `🚧 In progress` and update **Current Focus**
- **When fully done:** tick every requirement and acceptance criterion, add an `Implemented` section, set `✅ Done (DD/MM/YYYY)`, rename the ticket file and H1 with the `[DONE] ` prefix, tick the phase item and **Current Focus**, refresh `README.md` and then add a session entry to `project-memory.md`
- **Never** mark a ticket done while any requirement or acceptance criterion is open
- **Documentation split:** this file keeps order and scope; decisions and session history go to `project-memory.md`, and dated notes (implementation detail, design spikes, ADRs) go to `session-notes/YYYY-MM-DD-<slug>.md`
- Follow `AGENTS.md` for code rules, `guidelines/` for architecture/security and `project-memory.md` for decisions and business rules
- Tests for critical business logic; commit only when the user asks and group changes by logical block; code and docs in English
