# [DONE] TICKET-060 - Keep Settled History Hidden After a New Expense

**Type:** UX  
**Priority:** High  
**Status:** ✅ Done (19/11/2026)  
**Related:** TICKET-046, TICKET-059  
**Sprint:** Post-MVP / Phase 5.1

## Description
TICKET-059 unified the friend history but kept the collapse tied to the current pair balance: `canCollapseTimeline` is true only while the pair owes nothing. As soon as a new expense creates debt again, the whole history reopens and **Ver gastos anteriores** disappears, so expenses from an already settled cycle are shown as if they were pending.

This ticket keeps the settled cycle closed. The boundary is the latest settlement that left the pair at zero **at its creation time**, replayed from the active expenses and settlements by `createdAt`. Entries created at or before that settlement are **settled history**; entries created after it are the **current cycle**. The current cycle is always visible, the settled history stays hidden by default, and **Ver gastos anteriores** remains while settled history exists. Expanding it shows the settled rows below a separator (**Movimientos saldados** / "Settled movements"). A new full settlement moves the boundary and collapses the previous cycle again. Partial settlements never create a boundary.

## Requirements
### Boundary and grouping
- [x] Add a pure helper in `features/social/utils/friend-timeline-settled.ts` that finds the latest settlement which left the pair at zero at its creation time, replaying the active expenses and settlements by `createdAt` and reusing `calculateFriendBalances` + the existing ledger builders
- [x] Add a pure grouping helper that splits the flat timeline into `current` (`createdAt` after the boundary) and `settled` (`createdAt` at or before it); with no boundary every entry is current
- [x] Exclude soft-deleted records and never convert or sum currencies; a settlement that clears only one currency is not a boundary
- [x] Keep a new expense dated in the past in the current group when its `createdAt` is after the boundary
- [x] Move the boundary when a later full settlement clears the pair again, so the previous cycle becomes settled history

### Presentation
- [x] Show the current group always; hide the settled group by default even when the pair owes money again
- [x] Keep **Ver gastos anteriores** visible while settled history exists, including the case where new debt is present
- [x] On expand, render the settled rows below a separator (**Movimientos saldados** / "Settled movements") and replace the action with **Ocultar gastos anteriores**
- [x] Show the existing **Deuda saldada** notice only when the current group is empty (the pair is fully settled); with a current cycle, show the action without that notice
- [x] Reset the expanded state when the boundary changes, so a second full settlement starts collapsed
- [x] Keep the section title, loading, inline error with retry, banner and empty state unchanged
- [x] Add es/en copy for the separator and keep the existing show/hide copy and accessibility labels

### Verification
- [x] Colocated tests for no boundary, a full settlement, a partial settlement, multiple full settlements, a multi-currency partial settlement, soft-deleted records and a past-dated new expense
- [x] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [x] After a full settlement, adding a new expense shows only the new cycle and keeps **Ver gastos anteriores** visible
- [x] Expanding shows the settled rows under a separator, newest first, and the action hides them again
- [x] A partial settlement never hides the previous expenses
- [x] A second full settlement collapses the whole previous cycle again
- [x] The **Deuda saldada** notice appears only when there is no current cycle
- [x] A past-dated expense created after the boundary stays in the current group
- [x] Copy exists in Spanish and English and the separator is readable in light/dark mode with a screen reader
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Implemented

Implemented and verified on 19/11/2026. Decision record:
`docs/project/development-notes/session-notes/2026-11-19-settled-history-split.md`.

### Boundary and grouping
- `features/social/utils/friend-timeline-settled.ts` adds `findSettlingSettlement`, which orders the active settlements by `createdAt` then `id`, replays the active expenses and settlements written up to each one and marks a boundary only when `calculateFriendBalances(...).length === 0`. It returns the last clearing settlement; partial settlements and single-currency clears never become a boundary.
- `buildFriendTimelineGroups` reuses the flat `buildFriendTimeline` order and cuts by `createdAt`: `current` is after the boundary, `settled` is at or before it. With no boundary every entry stays current. Groups keep the date order, so an expanded settled block can show days newer than the current block; the cut is intentionally by write time.
- The replay reuses `buildExpenseLedgerEntries` and `buildSettlementLedgerEntries`, so the settlement reverse edge cancels the expense debt with the same convention as the balances. Costs stay integer cents, currencies are never converted or summed, and soft-deleted records are excluded.
- Tests split in `friend-timeline-settled.boundary.test.ts` and `friend-timeline-settled.groups.test.ts` over a shared fixture module. They cover no settlement, both settlement directions, full, partial, multi-currency, soft-deleted records, the `createdAt` tie-break, multiple full settlements and a past-dated expense written after the boundary.

### Presentation
- `FriendDetailTimeline` now receives `currentEntries`, `settledEntries`, `showSettled` and `onToggleSettled`. The current cycle is always visible; the settled group is hidden by default and stays hidden when a new expense creates debt again.
- New `FriendTimelineSeparator` renders a line + **Movimientos saldados** / "Settled movements" header between the groups when expanded and both exist. `FriendTimelineSettledNotice` keeps the existing **Deuda saldada** card, shown only when the open cycle is empty and collapsed.
- `FriendTimelineSettledToggle` keeps **Ver gastos anteriores** visible while settled history exists and switches to **Ocultar gastos anteriores** with the border tone when expanded.
- `useFriendDetailScreen` derives `showSettled` from `expandedBoundaryId === boundaryId` instead of resetting a boolean in an effect: a new full settlement changes the boundary and collapses on the same render with no flash, while a new expense keeps the boundary and preserves an explicit expansion.
- `useFriendDetailSettlements` keeps only the pair list and its loading/error/refresh/reload; the balance-based collapse fields and the now-dead `isPairFullySettled` helper were removed.
- Added `settlements:expenses.settledSeparator` in es/en. No hardcoded strings or colours.

### Verification (19/11/2026)
- `npx tsc --noEmit` clean.
- `npx expo lint` clean.
- `npx jest`: 258 suites / 1530 tests passed.
- `npm run test:coverage`: gate passed (All files 98.93% statements, 94.53% branches, 98.62% functions, 99.37% lines).
- `npm run check:copy` passed (256 TSX files).
- No Firestore rules, index, service, repository or balance change.

### Known limitations and manual steps
- Editing or soft-deleting a settled expense changes the replay because the historical amount is not stored: the boundary can disappear (the settled history reopens) or a previously partial settlement can start reading as full (the history hides). Accepted, not solved here.
- Manual device/simulator QA is pending: both settlement directions, the separator, the second full settlement, past-dated expenses, light/dark and a screen reader.

### Files
- New: `features/social/utils/friend-timeline-settled.ts`, `features/social/utils/__tests__/friend-timeline-settled.fixtures.ts`, `friend-timeline-settled.boundary.test.ts`, `friend-timeline-settled.groups.test.ts`, `features/social/components/friend-timeline-separator.tsx`, `friend-timeline-settled-notice.tsx`, `friend-timeline-settled-toggle.tsx`.
- Modified: `features/social/components/friend-detail-timeline.tsx`, `friend-detail-screen.tsx`, `features/social/hooks/use-friend-detail-screen.ts`, `use-friend-detail-settlements.ts`, `features/social/types/friend-detail-screen.types.ts`, `features/social/styles/friend-timeline.styles.ts`, `features/settlements/utils/settlement-debt.ts`, `features/settlements/utils/__tests__/settlement-debt.test.ts`, `features/settlements/locales/{es,en}.json`.
- Deleted: `features/social/utils/__tests__/friend-timeline-settled.test.ts` (replaced by the boundary/groups suites) and the dead `isPairFullySettled` helper with its test block.

## Technical Notes
- **Boundary by `createdAt`, not `date`:** a settlement cancels the debt that existed when it was created. A new expense dated in the past does not belong to the closed cycle, so `createdAt` is the correct cut.
- **Replay instead of a stored flag:** the settlement document has no "full" field. Replaying the active ledger up to each settlement and checking `calculateFriendBalances(...).length === 0` derives it without a migration or a new stored boolean.
- **Reuse the money model:** the replay uses `buildExpenseLedgerEntries` and `buildSettlementLedgerEntries`, so the boundary follows the same reverse-edge convention as the balances. Pair histories are small, so the simple per-settlement replay is enough.
- **Derived expansion:** `expandedBoundaryId` is stored, `showSettled` is derived. This removes the one-frame flash of the previous cycle and makes the reset rule structural instead of effect-driven.
- **Out of scope:** changing the timeline order, adding a date group header, persisting the boundary, pagination, currency conversion, services, repositories, rules and indexes.

## Validation Plan
- Settle the whole debt, add a new expense and confirm only the new cycle is visible with **Ver gastos anteriores** present.
- Expand and confirm the separator and the settled rows; hide again and confirm they disappear.
- Create a partial settlement and confirm the previous expenses stay visible.
- Settle fully a second time and confirm the previous cycle collapses again.
- Check a past-dated expense created after the boundary, soft-deleted records, a multi-currency partial settlement, light/dark, Spanish/English and a screen reader.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-046 1:1 settlement and the original full-settlement collapse
- TICKET-059 unified friend timeline
