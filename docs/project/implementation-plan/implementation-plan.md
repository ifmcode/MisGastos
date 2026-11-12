# Implementation Plan: MisGastos (Expense Manager + Splitwise)

> Living document. Update with each agreed feature. Always start from MVP.
> **Last reviewed:** 12/11/2026

## 0. Current Focus
> Keep this block up to date at the start and end of every session. It is the
> first thing an agent must read to know which ticket is active and what comes next.

| Field | Value |
|---|---|
| **Phase** | B - Architecture and workflow spike (next) |
| **Current ticket** | TICKET-023 - Offline-first design spike |
| **Current status** | ⏳ Pending |
| **Last completed** | TICKET-029 - Compact wallet selector (12/11/2026) |
| **Next after current** | TICKET-024 - Agent and skill specialization (Phase B) |

## 1. Inspiration: Expense Manager + Splitwise
**References:** `docs/project/ui-references/expense-manager-reference.png` and `docs/project/ui-references/splitwise-reference.png`

**Expense Manager:** Personal control, accounts/wallets, categories, income/expenses, balance, charts, history, budgets.
**Splitwise:** Groups, expense splitting (equal, percentage, amounts), balances between friends, "who owes whom", settlements, group activity.

Goal: Merge both worlds - personal + shared finances without unnecessary complexity.

**Analysis from screenshots:**
- Expense manager: summary/balance focus, recent transactions, quick add expense/income, wallets/accounts organization
- Splitwise: social focus - groups, friend balances ("owes you"/"you owe"), activity, flexible splitting, simplified balances

## 2. MVP (Minimum Viable Product)
| ID | Feature | Description | Status | Notes |
|---|---|---|---|---|
| MVP-001 | Authentication | Email/password + Google login (exists) | ✅ Done | TICKET-000; improve validation/error handling |
| MVP-002 | Wallet/Account | Create wallet with name, currency, icon, color, initial balance, type (cash/bank/other). Option **"Include in total"** toggle. If no initial balance -> 0 | ✅ Done | TICKET-001; list, create, per-wallet balance, totals by currency. Edit/archive/deletion completed in TICKET-018 |
| MVP-003 | Expense/Income | Create transaction with amount, date, concept/category, wallet, notes, type (expense/income). Currency inherited from wallet by default but **selectable**. Creating/editing/deleting must update wallet balance | ✅ Done | TICKET-002; CRUD, history, filters and sorting |
| MVP-004 | Transfer between wallets | Move money between own wallets (updates balances). Must be atomic | ✅ Done | TICKET-003; `transfers` collection, `runTransaction`, same currency only, editable and soft-deletable with balance reversion |
| MVP-005 | History with filters/sorting | List by date, filter by wallet/type/category, sort asc/desc | ✅ Done | TICKET-002; efficient FlatList |
| MVP-006 | Dashboard/Summary | Total balance, per wallet, filter by wallet or all | ✅ Done | TICKET-003 + TICKET-027; global/per-wallet totals, recent movements and recent transfers |

## 3. Post-MVP

### 3.1 Profile and settings
| ID | Feature | Description | Status | Ticket |
|---|---|---|---|---|
| PM-001 | User profile | Edit name, preferred currency, settings | ⏳ Pending | TICKET-006 |
| PM-002 | Preferred currency | Currency selector, conversion later if needed | ⏳ Pending | TICKET-006 |

### 3.2 Friends
| ID | Feature | Description | Status | Ticket |
|---|---|---|---|---|
| PM-003 | Friend management | Search by email/ID, send/accept/reject request | ⏳ Pending | TICKET-007 |
| PM-004 | Friends list | View friends, see balance with each | ⏳ Pending | TICKET-007 |

### 3.3 Groups (Splitwise-style)
| ID | Feature | Description | Status | Ticket |
|---|---|---|---|---|
| PM-005 | Create group | Name, members (friends), group currency, description | ⏳ Pending | TICKET-008 |
| PM-006 | Shared expense | Add expense, split (equal/percentage/amounts/shares) | ⏳ Pending | TICKET-009 |
| PM-007 | Group balances | "Who owes whom", simplified debts | ⏳ Pending | TICKET-010 |
| PM-008 | Settlements | Record payment between members to settle debt | ⏳ Pending | TICKET-010 |
| PM-009 | Group history | Activity, expenses, settlements | ⏳ Pending | TICKET-011 |

### 3.4 General improvements
| ID | Feature | Description | Status | Ticket |
|---|---|---|---|---|
| PM-010 | Categories | Create/edit with icon/color, type (expense/income), full CRUD | ✅ Done | TICKET-004 |
| PM-011 | Budgets | Budget by category/wallet with alerts | ⏳ Pending | TICKET-012 |
| PM-012 | Export data | CSV/PDF (evaluate later) | ⏳ Pending | TICKET-013 |
| PM-013 | Dark mode | Polish existing support and add a Settings toggle to enable/disable dark mode | ✅ Done | TICKET-014 |
| PM-014 | Advanced search | By text/concept, date range, multiple filters | ⏳ Pending | TICKET-015 |
| PM-015 | Date picker UX | Quick Hoy/Ayer chips, calendar button (native on mobile, in-app on web) and manual fallback in forms and filters | ✅ Done | TICKET-005 |

### 3.5 Gaps found during the 03/11/2026 review
| ID | Feature | Description | Status | Ticket |
|---|---|---|---|---|
| PM-016 | Statistics and charts | Income vs expense, category breakdown and monthly trend | ⏳ Pending | TICKET-016 |
| PM-017 | History grouped by day/month | Grouped movements with period totals and sticky headers | ⏳ Pending | TICKET-017 |
| PM-018 | Wallet management | Edit wallet data and archive/delete safely when unused | ✅ Done | TICKET-018; edit form with locked currency, archive/restore, and deletion with reassignment or `[Eliminada]` placeholder |
| PM-019 | Dashboard quick add | Create expense/income directly from the dashboard reusing the transaction form | ⏳ Pending | TICKET-019 |

### 3.6 Auth and movement UX (03/11/2026)
| ID | Feature | Description | Status | Ticket |
|---|---|---|---|---|
| PM-020 | Inline auth errors | Replace dialogs/alerts in login and registration with messages next to the action that failed | ✅ Done | TICKET-020; field + action inline feedback, Firebase error mapping, password reset feedback |
| PM-021 | Email verification | Send a verification email when an email/password account is created | ✅ Done | TICKET-021; private routes blocked until verified, dedicated `/verify-email` screen with resend, manual refresh and controlled polling |
| PM-022 | Discoverable movement actions | Make edit/delete for expenses, incomes and transfers visible and accessible (core logic already exists) | ✅ Done | TICKET-022; Pressable cards, pencil affordance, accessibility labels/hints and tests. Delete stays in the edit form with a project-owned `ConfirmDialog` that works on web |

### 3.7 Platform and workflow epics
| ID | Feature | Description | Status | Ticket |
|---|---|---|---|---|
| PM-023 | Offline-first and sync | Use the app without internet and sync local changes with Firebase when connectivity returns, including personal and shared movements | ⏳ Pending | TICKET-023 |
| PM-024 | Agent and skill specialization | Define project-specific agents and skills so each task is routed to the right specialist | ⏳ Pending | TICKET-024 |

### 3.8 Personal finance UX follow-up (10/11/2026)
| ID | Feature | Description | Status | Ticket |
|---|---|---|---|---|
| PM-025 | Movement detail view | Open a read-only movement detail with edit and delete actions in the top-right corner | ✅ Done | TICKET-025; detail modal resolves live movements, reuses the edit form and confirmation dialog, and handles missing movements |
| PM-026 | Transfer history | Dedicated transfer history reachable from the accounts tab | ✅ Done | TICKET-026; protected `/transfers` route, accounts and dashboard entry points, shared transfer form, ordering/dedupe and archived/deleted wallet-name tests |
| PM-027 | Home recent movements and transfers | Remove wallet cards, show up to 3 recent movements and 3 recent transfers with history links | ✅ Done | TICKET-027; home summary, conditional history actions and independent section states |
| PM-028 | Compact category selector | Three category chips plus `+` opening a **Seleccionar categoría** popup with all categories and inline creation | ✅ Done | TICKET-028; compact chips with selected-first ordering, full-category popup, inline creation and chip-limit tests |
| PM-029 | Compact wallet selector | Compact wallet chips plus a **Seleccionar cartera** popup, no creation, and fix the missing third wallet | ✅ Done | TICKET-029; selected-first chips, read-only full-wallet popup, shared transfer source/destination pattern and focus refresh for stale wallet data |

## 4. Key Business Rules
- **No photos initially**: No avatar/photo uploads. Use initials/icons
- **Multi-wallet**: Every expense/income must be associated to a wallet
- **Own transfers**: Don't affect net global balance but affect per-wallet balances
- **Shared expenses**: Precise balance calculation. Avoid floats carelessly (use cents/integers or Decimal)
- **Currency**: Store currency per wallet and per group. Conversion out of MVP
- **Timestamps**: createdAt/updatedAt with serverTimestamp or ISO Date
- **Soft deletes**: Consider `deletedAt` before hard delete

## 5. Research Notes
**Splitwise typical:** groups, payer, flexible split, simplified balances, activity, settlements, categories, partial multi-currency.
**Expense manager typical:** accounts, transactions, categories, daily/monthly balance, charts, budgets, transfers.

**Recommended additions:**
- "Pay all" / quick settlement
- Net balance: "Owes you X / You owe Y"
- History grouped by day/month
- Icons per category/wallet
- Strong amount validations (> 0)

## 6. Ticket Workflow Checklist

### Before starting a ticket
- [ ] Update §0 Current Focus with the phase, ticket and status `🚧 In progress`
- [ ] Set the ticket `Status` to `🚧 In progress`
- [ ] Read the ticket, related tickets, guidelines and development notes
- [ ] Create/update the ticket in `docs/project/tickets/` if it does not exist

### While working
- [ ] Follow architecture/SOLID guidelines
- [ ] Add tests if business logic
- [ ] Document decisions in `docs/project/development-notes/`
- [ ] Update memory if an important decision changes

### When the ticket is fully done
- [ ] Tick every requirement and acceptance criterion in the ticket
- [ ] Set the ticket `Status` to `✅ Done (DD/MM/YYYY)` and add an `Implemented` section
- [ ] Rename the ticket file with the `[DONE] ` prefix and update its H1, keeping the ticket id (for example `[DONE] TICKET-022-...md` and `# [DONE] TICKET-022 - ...`)
- [ ] Update the implementation plan: feature status, phase checkbox and §0 Current Focus (next ticket)
- [ ] Update `docs/project/development-notes/roadmap.md`
- [ ] Add the session entry to `docs/project/development-notes/project-memory.md`

## 7. Review Notes (03/11/2026, updated 11/11/2026)
- **Verified as done:** MVP-001..MVP-006, PM-010, PM-015 and PM-020..PM-022. Their tickets exist and match the current implementation.
- **Partially implemented, still pending:**
  - PM-014: filters already cover wallet, type, category, date range and sorting; free-text/concept search is missing.
  - PM-001/PM-002: Settings only shows account data and logout; editing the profile and choosing a preferred currency are missing.
- **Not implemented:** friends, groups, shared expenses, balances, settlements, group history, budgets, data export.
- **New gaps identified:** statistics/charts, history grouping, wallet editing/archiving and dashboard quick add. They were added as PM-016..PM-019.
- **Auth and movement UX gaps:** login/register currently use `alert()` instead of inline feedback; no verification email is sent on signup; transaction and transfer edit/delete already work through the form modal but the list items do not expose the action clearly. They were added as PM-020..PM-022.
- **Tickets created:** TICKET-006..TICKET-022 cover the pending product items above. TICKET-023 and TICKET-024 add the platform and workflow epics agreed on 04/11/2026.
- **08/11/2026:** TICKET-020, TICKET-021 and TICKET-022 verified as done and renamed with the `[DONE] ` prefix. TICKET-014 (dark mode + Settings toggle) is the next Phase A ticket.
- **09/11/2026:** TICKET-014 verified as done and renamed with the `[DONE] ` prefix. PM-013 is complete: the theme provider, persisted manual override and shared tokens cover login, settings, forms, filters, calendars, modals and dashboard surfaces. Visual checks are documented in `docs/project/testing/dark-mode-visual-checks.md`.
- **10/11/2026:** TICKET-018 verified as done and renamed with the `[DONE] ` prefix. PM-018 is complete and Phase A is closed: wallets can be edited with a locked currency, archived/restored, and deleted with reassignment or a `[Eliminada]` placeholder. Archived wallets leave selectors and totals while history keeps its stored names.
- **10/11/2026:** Reviewed the new personal-finance UX requests against existing tickets. TICKET-022 already covered discoverable edit/delete actions, but not a movement detail view, so TICKET-025 extends it. TICKET-019 covers dashboard quick add only, so home layout, transfer history and compact selectors were split into TICKET-026..TICKET-029. No existing ticket duplicated these requests.
- **11/11/2026:** TICKET-025 verified as done and renamed with the `[DONE] ` prefix. PM-025 is complete: tapping a movement opens a read-only detail view with top-right edit/delete actions, live wallet-name resolution for archived/deleted wallets, the existing form and confirmation flow, and a missing-movement state. Phase A.1 continues with TICKET-026.
- **11/11/2026:** TICKET-026 verified as done and renamed with the `[DONE] ` prefix. PM-026 is complete: the protected `/transfers` route lists every non-deleted transfer once, newest first, with pull-to-refresh, empty/error states and archived/deleted wallet names. The accounts screen and dashboard recent-transfers header both link to it. The transfer form modal, defaults and delete confirmation moved into the transfers feature so the dashboard and history share one form. Phase A.1 continues with TICKET-027.
- **11/11/2026:** TICKET-027 verified as done and renamed with the `[DONE] ` prefix. PM-027 is complete: the home tab is now a scrollable summary with wallet filters, totals, three recent movements and three recent transfers. History actions only appear when the full collections exceed three, pull-to-refresh reloads both collections, and the movement/transfer sections own their loading, error and empty states. Totals still use active wallets and ignore archived ones. Phase A.1 continues with TICKET-028.
- **12/11/2026:** TICKET-028 verified as done and renamed with the `[DONE] ` prefix. PM-028 is complete: the movement form shows three category chips plus a `+` chip that opens **Seleccionar categoría**, keeps the selected category visible and reuses the inline creation flow. Phase A.1 continues with TICKET-029.
- **12/11/2026:** TICKET-029 verified as done and renamed with the `[DONE] ` prefix. PM-029 is complete: the movement and transfer forms show up to three wallet chips plus a `+` chip that opens a read-only **Seleccionar cartera** popup with every active wallet. The missing third wallet was a stale-data bug: the movements tab and dashboard loaded wallets only on first mount, so wallets created in the accounts tab never reached their forms. Both screens now refresh wallets on focus. Phase A.1 is complete; Phase B starts with TICKET-023.

## 8. Recommended Execution Order (04/11/2026)

> Guiding principle: validate the social value before deep visual polish, but fix high-friction UX and take the offline/architecture decisions before building shared ledgers.
> Check a box only when the ticket is fully done and its file has been renamed with the `[DONE] ` prefix.

### Phase A - Short product polish (3-7 days)
- [x] TICKET-020: inline auth errors. ✅ Done 05/11/2026
- [x] TICKET-021: email verification. ✅ Done 06/11/2026
- [x] TICKET-022: visible and accessible edit/delete actions. ✅ Done 08/11/2026
- [x] TICKET-014: dark mode, shared visual tokens and a Settings toggle. ✅ Done 09/11/2026
- [x] TICKET-018: wallet editing/archiving, deletion with reassignment and archived history. ✅ Done 10/11/2026
- Build only the UI primitives needed next: button, input, list row, avatar, banner, empty state and modal.
- Phase A is complete. Phase A.1 is also complete; Phase B starts with TICKET-023 before the social slice.

### Phase A.1 - Personal finance UX follow-up (complete)
- [x] TICKET-025: movement detail view with top-right edit and delete actions. ✅ Done 11/11/2026
- [x] TICKET-026: dedicated transfer history from the accounts tab. ✅ Done 11/11/2026
- [x] TICKET-027: home without wallet cards, with 3 recent movements and 3 recent transfers. ✅ Done 11/11/2026
- [x] TICKET-028: compact category selector with a full-category popup and inline creation. ✅ Done 12/11/2026
- [x] TICKET-029: compact wallet selector, no creation, and fix the missing third wallet (Juanilla). ✅ Done 12/11/2026
- Phase A.1 is complete. Phase B starts with TICKET-023.

### Phase B - Architecture and workflow spike (2-4 days)
- [ ] TICKET-023 (design spike only): decide local database, outbox, idempotency and conflict policy before groups. ⏳ Pending
- [ ] TICKET-024: define the first 3-4 agents and their skills; avoid agent sprawl. ⏳ Pending
- Record the decisions in ADRs or development notes.

### Phase C - Social vertical slice (1-2 weeks)
- [ ] TICKET-007: friends and requests. ⏳ Pending
- [ ] Minimal subset of TICKET-009: 1:1 shared expense. ⏳ Pending
- [ ] Minimal subset of TICKET-010: balance and settlement between two people. ⏳ Pending
- Validate with 3-5 real users.
- Do not build a friends list without shared expenses; it does not validate the product.

### Phase D - Groups
- [ ] TICKET-008: create groups. ⏳ Pending
- [ ] Full TICKET-009: equal, percentage, fixed-amount and share splits. ⏳ Pending
- [ ] TICKET-010: group balances and settlements. ⏳ Pending
- [ ] TICKET-011: group history. ⏳ Pending

### Phase E - Offline-first implementation
- [ ] Full TICKET-023: local persistence, offline mutations, sync queue, conflict handling and offline group/friend movements. ⏳ Pending
- If offline is a launch requirement, move this phase before Phase D.
- Do not retrofit offline after groups without the Phase B decisions; the current Firestore transaction-based balance model may need to change.

### Phase F - Retention and final polish
- [ ] TICKET-012 budgets, TICKET-016 statistics, TICKET-015 advanced search, TICKET-013 export, TICKET-017 history grouping and TICKET-019 dashboard quick add. ⏳ Pending
- Then invest in final visual polish with real social screens.

### Decision rules
- **Validate the Splitwise side:** Phase A -> B -> C -> D.
- **Offline-first launch:** Phase A -> B -> E -> C -> D.
- **Polished personal-finance MVP:** Phase A -> F, and delay social features.
- **Never** implement full offline after groups without the Phase B spike.
