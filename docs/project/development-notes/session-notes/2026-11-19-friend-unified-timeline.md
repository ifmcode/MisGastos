# Friend unified timeline (TICKET-059)

**Date:** 19/11/2026  
**Ticket:** `[DONE] TICKET-059-FRIEND-UNIFIED-TIMELINE.md`  
**Reference:** `docs/project/ui-references/friend screen reference.jpg`

## Context

The friend detail rendered two surfaces for the same pair history: a highlighted
card with the latest settlement and a separate **Gastos compartidos** card list
for expenses. The reference mockup, from the **Liquidar deudas** button
downwards, shows one movement register with settlements and expenses interleaved
by date. The scanner and add-expense buttons of the mockup stay out of scope.

Four decisions were closed with the user before implementation:

1. Full mockup row: date gutter, icon tile, title, meta and the viewer effect on
   the right for expenses.
2. Keep the full-settlement collapse, now hiding the whole timeline.
3. Keep the **Gastos compartidos** section title.
4. Replace the latest-settlement card with a timeline row.

## Join model

`features/social/utils/friend-timeline.ts` owns the join because it composes two
features (`shared-expenses` and `settlements`) for the friend detail; neither
ledger feature depends on the other.

- `buildFriendTimeline` maps pair expenses and settlements into a discriminated
  union (`kind`, stable `key`, `date`, `createdAt`, record), filters soft-deleted
  records defensively and sorts newest first by `date`, then `createdAt`, then
  `key` with `localeCompare`.
- `getExpenseTimelineEffect` reuses `buildExpenseLedgerEntries` instead of a
  second debt formula. An entry where the viewer is `toUserId` means the viewer
  lent; where the viewer is `fromUserId` means the viewer borrowed. Amounts stay
  in integer cents and the expense currency is never converted.
- No new query, composite index or rule change: both lists are already loaded
  viewer-scoped and the pair filter stays in memory.

## Rows and copy

`FriendTimelineRow` is the presentational shell: date gutter (short month with
the trailing period stripped above the day), 40x40 icon tile, title, optional
meta and optional right amount. It has no card border and no chevron so rows read
as one history.

- Expense: description, `Pagaste tú` / `Pagó {name}` plus the total, and
  `Prestaste {amount}` / `Pediste {amount}` on the right in the success/danger
  tone, omitted when the viewer has no effect. `receipt-outline` tile.
- Settlement: the existing payment sentence (`Pagaste … a …` / `… te pagó …`),
  the stored note as meta and no right amount. `cash-outline` tile on the new
  `successSurface` token.
- `FriendDetailTimeline` keeps the section title, loading, inline error with
  retry, banner, empty state and the full-settlement notice with the existing
  collapse copy.
- Expense rows navigate to `/social/expenses/[id]`; settlement rows navigate to
  `/social/settlements/[id]`. Navigation stays in the screen, never in a row.

## Accessibility

The expense label is the full date plus description, payer/total and effect; the
settlement label is the full date plus the payment sentence and the note. The
gutter is hidden from assistive technology so the date is not announced twice,
and each row keeps a translated hint (`sharedExpenses:row.openHint` /
`settlements:message.openHint`).

## Collapse semantics

`canCollapseTimeline` stays `isPairFullySettled(friend.balances) && activeCount > 0`.
The difference from TICKET-046 is that it now hides expenses **and** settlements.
The expanded flag resets when the timeline becomes collapsible again, so a new
debt followed by a second full settlement starts collapsed instead of inheriting
the previous expanded state.

## Dead code

`FriendDetailExpenses`, `FriendSharedExpensesList`, `SharedExpenseRow` and
`SettlementMessage` lost their only consumer and were deleted together with their
unused styles and copy (`sharedExpenses:row.yourShare*`,
`settlements:message.title/full/partial`). `sharedExpensesStyles.rowBody` stayed
because the friend picker dialog still uses it.

## Verification

- `npx tsc --noEmit` clean.
- `npx expo lint` clean.
- `npx jest`: 256 suites / 1517 tests passed.
- `npm run test:coverage`: gate passed (98.92% statements, 94.54% branches,
  98.61% functions, 99.36% lines).
- `npm run check:copy`: 253 TSX files checked.

Manual device/simulator QA is still pending: light/dark, VoiceOver/TalkBack,
pull-to-refresh, soft-deleted records, the full-settlement collapse and back
navigation. No Firestore rules, index, service or repository change.
