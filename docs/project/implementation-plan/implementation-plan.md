# Implementation Plan: MisGastos (Expense Manager + Splitwise)

> Living document. Update with each agreed feature. Always start from MVP.
> **Last reviewed:** 06/11/2026

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
| MVP-002 | Wallet/Account | Create wallet with name, currency, icon, color, initial balance, type (cash/bank/other). Option **"Include in total"** toggle. If no initial balance -> 0 | ✅ Done | TICKET-001; list, create, per-wallet balance, totals by currency. Edit/archive tracked in PM-018 |
| MVP-003 | Expense/Income | Create transaction with amount, date, concept/category, wallet, notes, type (expense/income). Currency inherited from wallet by default but **selectable**. Creating/editing/deleting must update wallet balance | ✅ Done | TICKET-002; CRUD, history, filters and sorting |
| MVP-004 | Transfer between wallets | Move money between own wallets (updates balances). Must be atomic | ✅ Done | TICKET-003; `transfers` collection, `runTransaction`, same currency only, editable and soft-deletable with balance reversion |
| MVP-005 | History with filters/sorting | List by date, filter by wallet/type/category, sort asc/desc | ✅ Done | TICKET-002; efficient FlatList |
| MVP-006 | Dashboard/Summary | Total balance, per wallet, filter by wallet or all | ✅ Done | TICKET-003; global/per-wallet totals, includes recent transfers |

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
| PM-013 | Dark mode | Polish existing support | ⏳ Pending | TICKET-014 |
| PM-014 | Advanced search | By text/concept, date range, multiple filters | ⏳ Pending | TICKET-015 |
| PM-015 | Date picker UX | Quick Hoy/Ayer chips, calendar button (native on mobile, in-app on web) and manual fallback in forms and filters | ✅ Done | TICKET-005 |

### 3.5 Gaps found during the 03/11/2026 review
| ID | Feature | Description | Status | Ticket |
|---|---|---|---|---|
| PM-016 | Statistics and charts | Income vs expense, category breakdown and monthly trend | ⏳ Pending | TICKET-016 |
| PM-017 | History grouped by day/month | Grouped movements with period totals and sticky headers | ⏳ Pending | TICKET-017 |
| PM-018 | Wallet management | Edit wallet data and archive/delete safely when unused | ⏳ Pending | TICKET-018 |
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

## 6. Checklist Before Each Feature
- [ ] Update implementation plan status
- [ ] Create/update ticket in docs/project/tickets/
- [ ] Follow architecture/SOLID guidelines
- [ ] Add tests if business logic
- [ ] Document in development-notes
- [ ] Update memory if important decision

## 7. Review Notes (03/11/2026)
- **Verified as done:** MVP-001..MVP-006, PM-010 and PM-015. Their tickets exist and match the current implementation.
- **Partially implemented, still pending:**
  - PM-013: the system light/dark theme is wired through `ThemedView`, `ThemedText` and `useFormTheme`, but the login screen and parts of settings still use fixed light colours.
  - PM-014: filters already cover wallet, type, category, date range and sorting; free-text/concept search is missing.
  - PM-001/PM-002: Settings only shows account data and logout; editing the profile and choosing a preferred currency are missing.
- **Not implemented:** friends, groups, shared expenses, balances, settlements, group history, budgets, data export.
- **New gaps identified:** statistics/charts, history grouping, wallet editing/archiving and dashboard quick add. They were added as PM-016..PM-019.
- **Auth and movement UX gaps:** login/register currently use `alert()` instead of inline feedback; no verification email is sent on signup; transaction and transfer edit/delete already work through the form modal but the list items do not expose the action clearly. They were added as PM-020..PM-022.
- **Tickets created:** TICKET-006..TICKET-022 cover the pending product items above. TICKET-023 and TICKET-024 add the platform and workflow epics agreed on 04/11/2026.

## 8. Recommended Execution Order (04/11/2026)

> Guiding principle: validate the social value before deep visual polish, but fix high-friction UX and take the offline/architecture decisions before building shared ledgers.

### Phase A - Short product polish (3-7 days)
- TICKET-020: inline auth errors.
- TICKET-021: email verification.
- TICKET-022: visible and accessible edit/delete actions.
- TICKET-014: dark mode and shared visual tokens.
- TICKET-018: wallet editing/archiving, if there is time.
- Build only the UI primitives needed next: button, input, list row, avatar, banner, empty state and modal.

### Phase B - Architecture and workflow spike (2-4 days)
- TICKET-023 (design spike only): decide local database, outbox, idempotency and conflict policy before groups.
- TICKET-024: define the first 3-4 agents and their skills; avoid agent sprawl.
- Record the decisions in ADRs or development notes.

### Phase C - Social vertical slice (1-2 weeks)
- TICKET-007: friends and requests.
- Minimal subset of TICKET-009: 1:1 shared expense.
- Minimal subset of TICKET-010: balance and settlement between two people.
- Validate with 3-5 real users.
- Do not build a friends list without shared expenses; it does not validate the product.

### Phase D - Groups
- TICKET-008: create groups.
- Full TICKET-009: equal, percentage, fixed-amount and share splits.
- TICKET-010: group balances and settlements.
- TICKET-011: group history.

### Phase E - Offline-first implementation
- Full TICKET-023: local persistence, offline mutations, sync queue, conflict handling and offline group/friend movements.
- If offline is a launch requirement, move this phase before Phase D.
- Do not retrofit offline after groups without the Phase B decisions; the current Firestore transaction-based balance model may need to change.

### Phase F - Retention and final polish
- TICKET-012 budgets, TICKET-016 statistics, TICKET-015 advanced search, TICKET-013 export, TICKET-017 history grouping and TICKET-019 dashboard quick add.
- Then invest in final visual polish with real social screens.

### Decision rules
- **Validate the Splitwise side:** Phase A -> B -> C -> D.
- **Offline-first launch:** Phase A -> B -> E -> C -> D.
- **Polished personal-finance MVP:** Phase A -> F, and delay social features.
- **Never** implement full offline after groups without the Phase B spike.
