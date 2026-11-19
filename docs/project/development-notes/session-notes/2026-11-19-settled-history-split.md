# Settled history split in the friend timeline (TICKET-060)

**Date:** 19/11/2026  
**Ticket:** `[DONE] TICKET-060-SETTLED-HISTORY-SPLIT.md`  
**Related:** TICKET-046 (settlement), TICKET-059 (unified timeline)

## Context

TICKET-059 unified the friend history but tied its collapse to the current pair
balance: once a new expense created debt, `canCollapseTimeline` became false, the
whole history reopened and **Ver gastos anteriores** disappeared. Expenses from a
cycle that a settlement had already closed looked pending again.

The requested behaviour: after a full settlement, a new expense shows only the
new cycle; **Ver gastos anteriores** stays; expanding it shows the older rows
below a separator between the unsettled and the settled ones.

## Boundary

The settlement document has no "full" flag, so the boundary is derived:

- Active settlements are ordered by `createdAt` then `id`.
- For each one, the active expenses and settlements written up to its
  `createdAt` are replayed with `buildExpenseLedgerEntries` and
  `buildSettlementLedgerEntries`.
- The settlement is a boundary when `calculateFriendBalances(...).length === 0`,
  i.e. every currency nets to zero. The last boundary wins.

This reuses the exact money model: the settlement reverse edge cancels the
expense debt with the same convention as the balances, currencies are never
converted or summed, and amounts stay in integer cents. Partial settlements and
single-currency clears are never boundaries.

Grouping cuts by `createdAt`, not by the expense `date`: a settlement cancels the
debt that existed when it was written, so a new expense dated in the past still
belongs to the open cycle. `current` is `createdAt > boundary.createdAt`;
`settled` is `<=`, including the boundary settlement itself.

Cost is O(settlements × records); pair histories are small, so the simple replay
is clearer than caching per-record folds.

## Presentation

- The current cycle is always visible. The settled group stays hidden by default,
  even when the pair owes money again.
- **Ver gastos anteriores** remains while settled history exists. Expanded, it
  becomes **Ocultar gastos anteriores**.
- When both groups exist and the settled one is expanded, a
  **Movimientos saldados** / "Settled movements" separator sits between them.
- The **Deuda saldada** notice is only shown when the open cycle is empty: it
  explains why the list starts empty, and disappears once the history is
  expanded.
- `FriendDetailTimeline` delegates to three small components:
  `FriendTimelineSeparator`, `FriendTimelineSettledNotice` and
  `FriendTimelineSettledToggle`.

## Expansion state

`showSettled` is derived from `expandedBoundaryId === boundaryId`, with the
boundary id in state. A new full settlement changes the boundary, so the flag
falls back to collapsed on the same render with no one-frame flash. A new expense
keeps the boundary, so an explicit expansion survives it. An effect-based reset
was rejected for both reasons.

## Limitation

Editing or soft-deleting an already settled expense changes the replay because
the historical amount is not stored. The boundary can disappear (the settled
history reopens) or a previously partial settlement can start reading as full
(the history hides). Accepted for V1; solving it would need a stored "settled at"
marker or an immutable ledger snapshot.

## Verification

- `npx tsc --noEmit` clean.
- `npx expo lint` clean.
- `npx jest`: 258 suites / 1530 tests passed.
- `npm run test:coverage`: gate passed (98.93% statements, 94.53% branches,
  98.62% functions, 99.37% lines).
- `npm run check:copy`: 256 TSX files checked.

Manual device/simulator QA is still pending: both settlement directions, the
separator, a second full settlement, past-dated expenses, light/dark and a screen
reader. No Firestore rules, index, service, repository or balance change.
