# Implementation Plan: MisGastos (Expense Manager + Splitwise)

> Living document. Update with each agreed feature. Always start from MVP.

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
| MVP-001 | Authentication | Email/password + Google login (exists) | ✅ Done | Improve validation/error handling |
| MVP-002 | Wallet/Account | Create wallet with name, currency, icon, color, initial balance, type (cash/bank/other). Option **"Include in total"** toggle. If no initial balance -> 0 | ✅ Done | List, create, per-wallet balance, totals by currency |
| MVP-003 | Expense/Income | Create transaction with amount, date, concept/category, wallet, notes, type (expense/income). Currency inherited from wallet by default but **selectable**. Creating/editing/deleting must update wallet balance | ✅ Done | CRUD, history, filters and sorting |
| MVP-004 | Transfer between wallets | Move money between own wallets (updates balances). Must be atomic | ✅ Done | `transfers` collection, `runTransaction`, same currency only, editable and soft-deletable with balance reversion |
| MVP-005 | History with filters/sorting | List by date, filter by wallet/type/category, sort asc/desc | ✅ Done | Efficient FlatList |
| MVP-006 | Dashboard/Summary | Total balance, per wallet, filter by wallet or all | ✅ Done | Global/per-wallet totals, includes recent transfers |

## 3. Post-MVP
### 3.1 Profile and settings
| ID | Feature | Description | Status |
|---|---|---|---|
| PM-001 | User profile | Edit name, preferred currency, settings | ⏳ Pending |
| PM-002 | Preferred currency | Currency selector, conversion later if needed | ⏳ Pending |

### 3.2 Friends
| ID | Feature | Description | Status |
|---|---|---|---|
| PM-003 | Friend management | Search by email/ID, send/accept/reject request | ⏳ Pending |
| PM-004 | Friends list | View friends, see balance with each | ⏳ Pending |

### 3.3 Groups (Splitwise-style)
| ID | Feature | Description | Status |
|---|---|---|---|
| PM-005 | Create group | Name, members (friends), group currency, description | ⏳ Pending |
| PM-006 | Shared expense | Add expense, split (equal/percentage/amounts/shares) | ⏳ Pending |
| PM-007 | Group balances | "Who owes whom", simplified debts | ⏳ Pending |
| PM-008 | Settlements | Record payment between members to settle debt | ⏳ Pending |
| PM-009 | Group history | Activity, expenses, settlements | ⏳ Pending |

### 3.4 General improvements
| ID | Feature | Description | Status |
|---|---|---|---|
| PM-010 | Categories | Create/edit with icon/color, type (expense/income), full CRUD | ⏳ Pending |
| PM-011 | Budgets | Budget by category/wallet with alerts | ⏳ Pending |
| PM-012 | Export data | CSV/PDF (evaluate later) | ⏳ Pending |
| PM-013 | Dark mode | Polish existing support | ⏳ Pending |
| PM-014 | Advanced search | By text/concept, date range, multiple filters | ⏳ Pending |

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
