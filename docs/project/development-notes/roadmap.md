# Roadmap - MisGastos

## Current Focus
- **Phase:** 4 - Platform and Workflow (Phase A.1 complete)
- **Current ticket:** TICKET-023 - Offline-first design spike (Phase B)
- **Last completed:** TICKET-029 - Compact Wallet Selector (12/11/2026)
- **Next:** TICKET-024 - Agents and skills specialization (Phase B)
- **Source of truth:** `docs/project/implementation-plan/implementation-plan.md` §0

## Phase 0: Organization (COMPLETED)
- [x] Create folder structure
- [x] Create memory, guidelines, plan, tickets
- [x] Define MVP merging expense manager + Splitwise

## Phase 1: Foundation (IN PROGRESS)
- [x] Create `features/` and `shared/` structure
- [x] Migrate auth to `features/auth` (repo+service) without breaking flow
- [ ] Create base UI Kit in `shared/components/atoms`
- [ ] Add common types (Result<T>, etc.)
- [ ] Configure test coverage >= 90%

## Phase 2: MVP Core
- [x] TICKET-001 Wallets
- [x] TICKET-002 Transactions + history + filters
- [x] TICKET-003 Transfers + dashboard

## Phase 3: Post-MVP
- [x] Categories management (TICKET-004)
- [x] Date picker UX (TICKET-005)
- [ ] Profile + preferred currency (TICKET-006)
- [ ] Friends (TICKET-007)
- [ ] Groups (TICKET-008)
- [ ] Shared expenses (TICKET-009)
- [ ] Group balances + settlements (TICKET-010)
- [ ] Group history (TICKET-011)
- [ ] Budgets (TICKET-012)
- [ ] Data export (TICKET-013)
- [x] Dark mode polish + Settings toggle (TICKET-014) ✅ 09/11/2026
- [ ] Advanced search (TICKET-015)
- [ ] Statistics + charts (TICKET-016)
- [ ] History grouped by day/month (TICKET-017)
- [x] Wallet management (TICKET-018) ✅ 10/11/2026
- [ ] Dashboard quick add (TICKET-019)
- [x] Inline auth errors (TICKET-020)
- [x] Email verification on signup (TICKET-021)
- [x] Discoverable edit/delete actions (TICKET-022)

## Phase 3.1: Personal Finance UX Follow-up (COMPLETED)
- [x] Movement detail view with edit/delete actions (TICKET-025) ✅ 11/11/2026
- [x] Transfer history from accounts (TICKET-026) ✅ 11/11/2026
- [x] Home recent movements and transfers (TICKET-027) ✅ 11/11/2026
- [x] Compact category selector (TICKET-028) ✅ 12/11/2026
- [x] Compact wallet selector + missing wallet fix (TICKET-029) ✅ 12/11/2026

## Phase 4: Platform and Workflow
- [ ] Offline-first design spike + sync (TICKET-023)
- [ ] Agents and skills specialization (TICKET-024)

## Rules
- Always update implementation plan §0 Current Focus when starting or finishing a ticket
- Update the phase checkbox in implementation plan §8 when a ticket is done
- When a ticket is fully done, rename its file and H1 with the `[DONE] ` prefix
- Document in development-notes after each session
- Follow guidelines
- Write tests for critical business logic
- Commit per logical block
- All names in English, code and docs
