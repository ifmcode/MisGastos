# Roadmap - MisGastos

> Development guide: V1 scope, phase order, ticket order and the current ticket.
> **Last reviewed:** 25/11/2026

## Scope of this file
- This file answers **what to build next and in which order**, plus the rules for doing it.
- It is **not** a development diary: implementation detail, delivered files and decisions belong to `project-memory.md` and to the dated notes in `session-notes/`.
- Every ticket lists its closed/open state and, for closed work, the closing date. The *how* is never described here.
- **Before starting a ticket:** update **Current Focus** and set the ticket `Status` to `🚧 In progress`.
- **When the ticket is done:** update **Current Focus**, tick the phase item below, refresh `README.md` and add the session entry to `project-memory.md` (see **Rules**).

## Product Vision
A personal finance manager (wallets, movements, transfers and dashboard) merged with Splitwise-style shared finances (friends, groups, shared expenses, balances and settlements). **V1.0 is everything defined in this roadmap**; the MVP was the first milestone, not the release.

## Current Focus
- **Milestone:** M4 - Offline and V1 closeout
- **Phase:** 7 - Offline-first implementation
- **Current ticket:** TICKET-023 - Offline-first implementation (full epic)
- **Status:** 🚧 In progress
- **Last completed:** TICKET-073 - Group activity in the group detail (24/11/2026)
- **Queued:** Phase 8 V1 closeout (TICKET-052, TICKET-074, TICKET-040)
- **Next:** continue TICKET-023 with the offline write queue for expenses, incomes and transfers (local balance derivation)
- **Tickets:** `docs/project/tickets/` (completed files use the `[DONE] ` prefix)

## V1.0 Scope
| Milestone | Scope | Phases | Status |
|---|---|---|---|
| **M1 - Core personal finance (MVP)** | Auth, wallets, movements, transfers, dashboard and history | 0, 2 | ✅ Done |
| **M2 - Personal finance complete** | UX follow-up, i18n and shared components | 3 | ✅ Done |
| **M3 - Social and platform** | Architecture spike, friends, shared expenses, balances, groups and group history | 4-6 | ✅ Done |
| **M4 - Offline and V1 closeout** | Offline-first implementation and V1 closeout: push notifications, integral visual redesign and Storybook | 7-8 | ⏳ Pending |

**V1.0 ships when M1-M4 are complete.** The release order is Phase 7 (offline-first) → TICKET-052 (push notifications) → TICKET-074 (integral visual redesign and UX alignment) → TICKET-040 (Storybook); V1 ships when TICKET-040 closes. Phase 9 and the post-V1 backlog start only after V1 ships. Phase 1 (foundation) is a completed cross-cutting quality track; its coverage gate stays enforced. Anything outside these phases is post-V1.

## Phase Overview
| Phase | Theme | Status |
|---|---|---|
| 0 | Organization | ✅ Done |
| 1 | Foundation | ✅ Done |
| 2 | MVP core | ✅ Done |
| 3 | Personal finance complete | ✅ Done |
| 4 | Architecture and workflow spike | ✅ Done |
| 5 | Social vertical slice | ✅ Done |
| 6 | Groups | ✅ Done |
| 7 | Offline-first implementation | 🚧 In progress |
| 8 | V1 closeout | ⏳ Queued |
| 9 | Post-V1 retention and enhancements | ⏳ Queued |

> Subphase numbers group related work; they are not a strict execution order. **Current Focus** is the execution order.
>
> The former `PM-xxx` feature ids remain as aliases in each ticket's `Related` field; ticket ids are the canonical reference.
>
> Tickets created before the 12/11/2026 consolidation may reference the old plan phases: A → 3, A.1 → 3.1, A.2 → 3.2, A.3 → 3.3, A.4 → 3.4, A.5 → 3.5, A.6 → 3.6, B → 4, C → 5, D → 6, E → 7, F → 9 (the former retention phase, now post-V1).

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

## Phase 5: Social vertical slice (COMPLETED)
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
- [x] TICKET-059: unified friend timeline interleaving shared expenses and settlements ✅ 19/11/2026
- [x] TICKET-060: keep settled history hidden after a new expense with a separator ✅ 19/11/2026

### 5.2 1:1 settlement and notifications
- [x] TICKET-046: 1:1 debt settlement with direct application ✅ 18/11/2026
- [x] TICKET-047: in-app notification inbox with pending/viewed sections and the in-app banner ✅ 18/11/2026
- [x] TICKET-058: notification back returns to the origin and the creditor wallet follow-up ✅ 18/11/2026
- The balance between two people already ships with TICKET-009; TICKET-046 replaces the former "minimal subset of TICKET-010" settlement line.
- Validate with 3-5 real users
- Do not build a friends list without shared expenses; it does not validate the product

### 5.3 Shared-expense form refinement
- [x] TICKET-055: optional wallet registration in shared expenses with a configurable default ✅ 18/11/2026
- [x] TICKET-056: compact currency field with **Cambiar** and the live remaining amount for the fixed split ✅ 20/11/2026

### 5.4 Initial onboarding
- [x] TICKET-057: default main wallet on account creation ✅ 20/11/2026

## Phase 6: Groups (COMPLETED)
- [x] TICKET-008: create groups, friend invitations, group detail and member management (consumes the Social → Tus grupos shell from TICKET-041) ✅ 20/11/2026
- [x] TICKET-061: group join code and join requests (deferred from TICKET-008) ✅ 20/11/2026
- [x] Full TICKET-009: group expenses with participant selection, payer outside the participants, per-expense currency, permissions, group detail list and detail route ✅ 21/11/2026
- [x] TICKET-010: group balances and settlements (reuse the TICKET-046 direct-settlement model, the receiver wallet movement and notification events) ✅ 23/11/2026
- [x] TICKET-011: group history ✅ 23/11/2026
- [x] TICKET-068: group membership lifecycle (leave, balance-safe removal and ownership transfer) ✅ 23/11/2026
- Constraint from the Phase 4 spike: shared expenses and settlements are append-only ledger entries folded by a shared pure function, so offline group movements work without a rewrite

### 6.0 Settlement and form polish (QUEUED)
> Execution order follows **Current Focus**; TICKET-010 must reuse TICKET-062 and TICKET-064 instead of a second settlement flow.
- [x] TICKET-062: editable settlement amount with the live remaining debt ✅ 21/11/2026
- [x] TICKET-063: date field without manual input and a calendar pinned to the right ✅ 21/11/2026
- [x] TICKET-064: settlement debt-selection step for multiple currencies ✅ 22/11/2026
- [x] TICKET-065: single wallet picker button without preselection ✅ 22/11/2026
- [x] TICKET-066: single category picker button with mandatory selection ✅ 22/11/2026
- [x] TICKET-067: Social pending requests as a top-right header icon with a badge ✅ 22/11/2026

### 6.1 Group wallet link and request placement (COMPLETED)
- [x] TICKET-069: optional personal movement for a group expense paid by the viewer, with the same wallet/category and atomic link as the 1:1 flow ✅ 22/11/2026
- [x] TICKET-070: manage the owner's group join requests from Social instead of the group detail ✅ 23/11/2026

### 6.2 Group expense form simplification (COMPLETED)
- [x] TICKET-071: no **Todos** shortcut and only **Igual**/**Importe** in the group-expense form, keeping legacy modes editable ✅ 23/11/2026

### 6.3 Group detail parity (COMPLETED)
- [x] TICKET-072: edit action and simplified-debts state in the details sheet, one linear expense+settlement timeline, and the debt list behind **Liquidar deudas** ✅ 23/11/2026

### 6.4 Group activity in the detail (COMPLETED)
- [x] TICKET-073: merge the group activity into the group detail as **Actividad del grupo** and remove the separate history route of TICKET-011 ✅ 24/11/2026

## Phase 7: Offline-first implementation (IN PROGRESS)
- [ ] Full TICKET-023 (design accepted in Phase 4)
  - [x] Foundations: local SQLite DB, client-generated ids, `revision`/`deletedAt`/`appliedMutations` and rules ✅ 24/11/2026
  - [x] Local read cache for personal data and offline banner ✅ 24/11/2026
  - [ ] Offline write queue for expenses, incomes and transfers with local balance derivation
  - [ ] Sync engine, retry/backoff, exactly-once and conflict UI
  - [ ] Offline group/friend movements (after Phase 6)
  - [ ] Offline UX, observability, account purge on logout/switch and web decision
- If offline is a launch requirement, move this phase before Phase 6
- Do not retrofit offline after groups without the Phase 4 decisions; the current Firestore transaction-based balance model may need to change

## Phase 8: V1 closeout (QUEUED)
- [ ] TICKET-052 push notifications for background and closed app (after Phase 7)
- [ ] TICKET-074 integral visual redesign and UX alignment (after push notifications)
- [ ] TICKET-040 Storybook component catalog (after the redesign; V1 ships when this closes)
- These three are the only V1 items left, and their order is the release order.

## Phase 9: Post-V1 retention and enhancements (QUEUED)
- [ ] TICKET-012 budgets
- [ ] TICKET-016 statistics
- [ ] TICKET-015 advanced search
- [ ] TICKET-013 export of wallets, movements, transfers, categories and account settings (excluding shared/group data)
- [ ] TICKET-017 history grouping
- [ ] TICKET-019 dashboard quick add
- These start only after V1 ships.

## Post-V1 backlog (NOT in V1 scope)
- [ ] TICKET-053 account data import
- [ ] TICKET-054 Google Drive backup and restore
- The Phase 9 tickets above are also post-V1. These are intentionally outside V1.0 scope, listed so their order and dependencies stay visible, and they start only after V1 ships.

## Ordering Rules
- **Recommended:** 0-3 → 4 → 5 → 6 → 7 → 8 (V1) → 9
- **Validate the Splitwise side first:** complete Phase 3, then 4 → 5 → 6, before 7 and 8
- **Offline-first launch:** complete Phase 3, then 4 → 7 → 5 → 6 → 8 → 9; Phase 8 stays together as the V1 closeout
- **Polished personal-finance first:** complete Phase 3, then 7 → 8 (V1), and delay the social phases (5 and 6) until the next release
- **Never** implement full offline after groups without the Phase 4 spike

## Rules
- This roadmap is the single source of truth for V1 scope, phase order and the current ticket
- **Before starting:** set the ticket `Status` to `🚧 In progress` and update **Current Focus**
- **When fully done:** tick every requirement and acceptance criterion, add an `Implemented` section, set `✅ Done (DD/MM/YYYY)`, rename the ticket file and H1 with the `[DONE] ` prefix, tick the phase item and **Current Focus**, refresh `README.md` and then add a session entry to `project-memory.md`
- **Never** mark a ticket done while any requirement or acceptance criterion is open
- **Documentation split:** this file keeps order and scope; decisions and session history go to `project-memory.md`, and dated notes (implementation detail, design spikes, ADRs) go to `session-notes/YYYY-MM-DD-<slug>.md`
- Follow `AGENTS.md` for code rules, `guidelines/` for architecture/security and `project-memory.md` for decisions and business rules
- Tests for critical business logic; commit only when the user asks and group changes by logical block; code and docs in English
