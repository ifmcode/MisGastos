# [DONE] TICKET-072 - Group Detail Social Parity

**Type:** UX  
**Priority:** Medium  
**Status:** ✅ Done (23/11/2026)  
**Related:** TICKET-009, TICKET-010, TICKET-042, TICKET-059, TICKET-064  
**Sprint:** Post-MVP / Phase 6

## Description
Bring the group detail closer to the friend detail after user feedback: the
group edit action lives inside **Detalles del grupo**, the details state whether
debts are simplified, expenses and settlements share one linear timeline, and
the debt list moves behind a **Liquidar deudas** action instead of occupying the
balances section.

## Requirements
- [x] The owner sees an **Editar grupo** action inside **Detalles del grupo**; the header keeps only the invite shortcut
- [x] **Detalles del grupo** states whether **Simplificar deudas** is on or off
- [x] The group detail shows one linear timeline interleaving active expenses
      and active settlements, newest first, reusing the shared timeline row
- [x] Expense and settlement rows keep their own destination (expense detail and
      settlement detail) and no card border
- [x] The separate **Liquidaciones** section disappears from the group detail
- [x] The balances section no longer renders the **Quién debe a quién** list; it
      shows a **Liquidar deudas** action whenever the group has debts
- [x] **Liquidar deudas** opens the debt-selection step on
      `/social/groups/[groupId]/settle`; rows where the viewer is debtor or
      creditor open the form, the rest stay read-only
- [x] Reuse the shared timeline row, the settlement button, `GroupDebtRow` and
      the existing settle route/form; no data, schema, service or rules change
- [x] Add tests for the group timeline builder (order, kinds, active only, ties)

## Acceptance Criteria
- [x] The owner can open the group edit form from the details sheet
- [x] The details sheet reads **Deudas simplificadas: Sí/No** from the group
- [x] Expenses and settlements appear interleaved in one linear history
- [x] Tapping a row opens the matching detail route
- [x] **Liquidar deudas** lists who owes whom and only the viewer's pairs are actionable
- [x] The group with no debts hides the action and shows the settled state
- [x] No document, service, rule or index change is introduced

## Implemented

### Shared molecules
- `TimelineRow` (`shared/components/molecules/timeline-row.tsx` + styles) now
  backs the friend timeline rows and the new group timeline rows: date gutter,
  icon tile, title, optional meta, optional right amount, pressed feedback and
  accessibility. The friend rendering is unchanged.
- `SettleButton` (`shared/components/molecules/settle-button.tsx` + styles) is
  shared by the friend header and the group balances; copy and callback stay in
  the feature that owns the namespace.

### Group timeline
- New pure `buildGroupTimeline({ expenses, settlements })`
  (`features/group-expenses/utils/group-timeline.ts`): drops soft-deleted
  records, keeps the original objects and sorts by `date` desc, `createdAt`
  desc, then `key` asc. Tests cover kinds, ordering, ties, soft deletes and no
  mutation.
- `GroupTimeline` replaces the separate expense and settlement sections:
  **Gastos del grupo**, one linear list (no card border), loading/error/empty
  states, expense rows with payer/total/your share and settlement rows with
  **Pagaste … / … te pagó … / … pagó …**. Each row opens its expense or
  settlement detail.
- `GroupExpensesSection`, `GroupSettlementsSection`, `GroupExpenseRow`,
  `GroupSettlementRow` and `GroupDebtsList` were deleted with their dead
  copy/styles.

### Balances, settle step and details
- The balances section keeps only the raw per-member nets (the viewer summary
  line and the settled card were removed on follow-up feedback); the section
  hides when the group is settled, while the header keeps **En paz**. The
  **Quién debe a quién** list moved behind a **Liquidar deudas** action that
  appears whenever `GroupBalances.debts` is not empty.
- The settle route with no pair returns `select` and renders
  `GroupSettlementDebtStep`, listing every debt with the direct/simplified
  caption; `GroupDebtRow` exposes the settle action only on the viewer's pairs.
  Selecting a row pushes the same route with `currency`/`from`/`to`, so back
  returns to the step.
- **Detalles del grupo** shows the **Deudas simplificadas: Sí/No** row and an
  owner-only **Editar grupo** button that closes the sheet and opens the edit
  form.

### Verification
- `npx tsc --noEmit`, `npx expo lint` and `npm run check:copy` clean (336 TSX).
- `npx jest --coverage`: **367 suites / 2369 tests**, coverage **99.04 %
  statements / 94.88 % branches / 98.62 % functions / 99.56 % lines**.
- No data, schema, service, rules, index or notification change; no deployment
  required. Manual device and dark-mode validation is pending.
- Note: `docs/project/development-notes/session-notes/2026-11-23-group-detail-social-parity.md`.

## Technical Notes
- Extract the friend timeline row into a shared molecule
  (`shared/components/molecules/timeline-row.tsx` + styles) and consume it from
  both the friend timeline and the new group timeline rows.
- New pure `features/group-expenses/utils/group-timeline.ts`:
  `buildGroupTimeline(expenses, settlements)` returns discriminated entries,
  drops soft-deleted records and sorts by `date` desc, `createdAt` desc, `key`
  asc (same rules as `buildFriendTimeline`).
- The settle route gains a `select` status when it opens without a pair and the
  group has debts; selecting a row pushes the same route with
  `currency`/`from`/`to` (back returns to the step, like TICKET-064).
- `GroupDebtRow` is reused inside the step; `canSettle` is already the viewer
  membership of the pair.
- The **Liquidar deudas** action appears when `GroupBalances.debts` is not empty,
  even if the viewer is not part of them; the step shows those debts read-only.

## Dependencies
- TICKET-010 Group balances and settlements (route, form and debt rows)
- TICKET-059 Friend unified timeline (sorting and row language)
