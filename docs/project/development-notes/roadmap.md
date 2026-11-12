# Roadmap - MisGastos

> Single source of truth for the V1 scope, phase order and the current ticket.
> The former `implementation-plan.md` was merged into this file on 12/11/2026.
> **Last reviewed:** 12/11/2026

## Product Vision
A personal finance manager (wallets, movements, transfers and dashboard) merged with Splitwise-style shared finances (friends, groups, shared expenses, balances and settlements). **V1.0 is everything defined in this roadmap**; the MVP was the first milestone, not the release.

## Current Focus
- **Milestone:** M2 - Personal finance complete
- **Phase:** 3.5 - Dashboard recent data and detail views
- **Current ticket:** TICKET-033 - Fix the dashboard recent transfers limit and freshness
- **Last completed:** TICKET-032 - Wallet transfer entry (12/11/2026)
- **Next:** TICKET-034 - Open movement detail from the dashboard
- **Tickets:** `docs/project/tickets/` (completed files use the `[DONE] ` prefix)

## V1.0 Scope
| Milestone | Scope | Phases | Status |
|---|---|---|---|
| **M1 - Core personal finance (MVP)** | Auth, wallets, movements, transfers, dashboard and history | 0, 2 | ✅ Done |
| **M2 - Personal finance complete** | UX follow-up, i18n and shared components | 3 | 🚧 In progress |
| **M3 - Social and platform** | Architecture spike, friends, shared expenses, balances, groups and group history | 4-6 | ⏳ Pending |
| **M4 - Offline and retention** | Offline-first implementation, budgets, statistics, search, export and final polish | 7-8 | ⏳ Pending |

**V1.0 ships when M1-M4 are complete.** Phase 1 (foundation) is a cross-cutting quality track: its open items are part of V1 but do not block M1. Anything outside these phases is post-V1.

## Phase Overview
| Phase | Theme | Status |
|---|---|---|
| 0 | Organization | ✅ Done |
| 1 | Foundation | 🚧 Ongoing |
| 2 | MVP core | ✅ Done |
| 3 | Personal finance complete | 🚧 In progress |
| 4 | Architecture and workflow spike | ⏳ Queued |
| 5 | Social vertical slice | ⏳ Queued |
| 6 | Groups | ⏳ Queued |
| 7 | Offline-first implementation | ⏳ Queued |
| 8 | Retention and final polish | ⏳ Queued |

> Subphase numbers group related work; they are not a strict execution order. **Current Focus** is the execution order.
>
> The former `PM-xxx` feature ids remain as aliases in each ticket's `Related` field; ticket ids are the canonical reference.
>
> Tickets created before the consolidation may reference the old plan phases: A → 3, A.1 → 3.1, A.2 → 3.2, A.3 → 3.3, A.4 → 3.4, A.5 → 3.5, A.6 → 3.6, B → 4, C → 5, D → 6, E → 7, F → 8.

## Phase 0: Organization (COMPLETED)
- [x] Create folder structure
- [x] Create memory, guidelines, roadmap and tickets
- [x] Define the MVP merging Expense Manager + Splitwise

## Phase 1: Foundation (ONGOING)
- [x] Create `features/` and `shared/` structure
- [x] Migrate auth to `features/auth` (repo + service) without breaking the flow
- [ ] Create the base UI kit in `shared/components/atoms` (resolve the unused atoms in TICKET-037)
- [ ] Add common types (`Result<T>`, etc.)
- [ ] Configure test coverage >= 90%

## Phase 2: MVP core (COMPLETED)
- [x] TICKET-000 Setup, auth and project organization
- [x] TICKET-001 Wallets
- [x] TICKET-002 Transactions + history + filters
- [x] TICKET-003 Transfers + dashboard

## Phase 3: Personal finance complete (IN PROGRESS)

### 3.1 Personal finance UX follow-up (COMPLETED)
- [x] Movement detail view with edit/delete actions (TICKET-025) ✅ 11/11/2026
- [x] Transfer history from accounts (TICKET-026) ✅ 11/11/2026
- [x] Home recent movements and transfers (TICKET-027) ✅ 11/11/2026
- [x] Compact category selector (TICKET-028) ✅ 12/11/2026
- [x] Compact wallet selector + missing wallet fix (TICKET-029) ✅ 12/11/2026

### 3.2 Category ordering (COMPLETED)
- [x] Reorder categories and reuse the order in every picker (TICKET-030) ✅ 12/11/2026

### 3.3 Internationalization (QUEUED)
- [ ] Extract all UI copy into per-feature translation files and add a Spanish/English selector in Settings (TICKET-031)
- [ ] Use `expo-localization` + i18next namespaces, persisted preference, `Intl` formatting and error-code mapping

### 3.4 Wallet transfer entry (COMPLETED)
- [x] Move **Transferir** from the dashboard header to the **Carteras** tab (TICKET-032) ✅ 12/11/2026

### 3.5 Dashboard recent data and detail views (NEXT)
- [ ] Fix the recent-transfers cap/freshness and add **Ver todos** (TICKET-033)
- [ ] Open the movement detail from a recent movement (TICKET-034)
- [ ] Add the transfer detail view with edit/delete (TICKET-035)
- [ ] Open the transfer detail from a recent transfer (TICKET-036)

### 3.6 Shared component extraction (QUEUED)
- [ ] Inventory and extract duplicated loading/error/empty states, form blocks and list rows into `shared/components` (TICKET-037)

### 3.7 Earlier post-MVP polish (COMPLETED)
- [x] Categories management (TICKET-004)
- [x] Date picker UX (TICKET-005)
- [x] Dark mode polish + Settings toggle (TICKET-014) ✅ 09/11/2026
- [x] Wallet management (TICKET-018) ✅ 10/11/2026
- [x] Inline auth errors (TICKET-020)
- [x] Email verification on signup (TICKET-021)
- [x] Discoverable edit/delete actions (TICKET-022)

### 3.8 Profile and preferred currency (QUEUED)
- [ ] Profile editing and a preferred-currency selector (TICKET-006)

## Phase 4: Architecture and workflow spike (QUEUED)
- [ ] TICKET-023 (design spike only): decide local database, outbox, idempotency and conflict policy before groups
- [ ] TICKET-024: define the first 3-4 agents and their skills; avoid agent sprawl
- Record the decisions in ADRs or development notes
- This phase runs before Phase 5; the full offline implementation is Phase 7

## Phase 5: Social vertical slice (QUEUED)
- [ ] TICKET-007: friends and requests
- [ ] Minimal subset of TICKET-009: 1:1 shared expense
- [ ] Minimal subset of TICKET-010: balance and settlement between two people
- Validate with 3-5 real users
- Do not build a friends list without shared expenses; it does not validate the product

## Phase 6: Groups (QUEUED)
- [ ] TICKET-008: create groups
- [ ] Full TICKET-009: equal, percentage, fixed-amount and share splits
- [ ] TICKET-010: group balances and settlements
- [ ] TICKET-011: group history

## Phase 7: Offline-first implementation (QUEUED)
- [ ] Full TICKET-023: local persistence, offline mutations, sync queue, conflict handling and offline group/friend movements
- If offline is a launch requirement, move this phase before Phase 6
- Do not retrofit offline after groups without the Phase 4 decisions; the current Firestore transaction-based balance model may need to change

## Phase 8: Retention and final polish (QUEUED)
- [ ] TICKET-012 budgets, TICKET-016 statistics, TICKET-015 advanced search, TICKET-013 export, TICKET-017 history grouping and TICKET-019 dashboard quick add
- Then invest in final visual polish with real social screens

## Ordering Rules
- **Recommended:** 0-3 → 4 → 5 → 6 → 7 → 8
- **Validate the Splitwise side first:** complete Phase 3, then 4 → 5 → 6
- **Offline-first launch:** complete Phase 3, then 4 → 7 → 5 → 6
- **Polished personal-finance first:** complete Phases 3 and 8, delay social
- **Never** implement full offline after groups without the Phase 4 spike

## Rules
- This roadmap is the single source of truth for V1 scope, phase order and the current ticket
- **Before starting:** set the ticket `Status` to `🚧 In progress` and update **Current Focus**
- **When fully done:** tick every requirement and acceptance criterion, add an `Implemented` section, set `✅ Done (DD/MM/YYYY)`, rename the ticket file and H1 with the `[DONE] ` prefix, update the phase checkbox and **Current Focus**, then add a session entry to `project-memory.md`
- **Never** mark a ticket done while any requirement or acceptance criterion is open
- Follow `AGENTS.md` for code rules, `guidelines/` for architecture/security and `project-memory.md` for decisions and business rules
- Tests for critical business logic; commit only when the user asks and group changes by logical block; code and docs in English
