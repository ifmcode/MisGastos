# Session note - Friend detail and shared expenses (TICKET-042)

**Date:** 16/11/2026  
**Ticket:** TICKET-042 (done)  
**Status:** ✅ Done (ticket file renamed with the `[DONE] ` prefix)

## Context
TICKET-041 left the **Social** tab as a hub and removed the shared-expenses
section from it, which left the app with no 1:1 expense entry point and no place
for a friend's debts beyond one line in the list. TICKET-042 gives every accepted
friend a dedicated screen that carries the identity, the per-currency balances,
the remove action and the pair's shared expenses.

## Decision
- **Route and composition.** `app/social/friends/[uid].tsx` renders
  `FriendDetailScreen` from `features/social` and is registered in
  `auth-navigator.tsx` as `social/friends/[uid]` with `headerShown: false`. The
  uid comes from `useLocalSearchParams` and is only an application id: it never
  builds a Firestore path.
- The screen is a composition root: `friend-detail-header.tsx` (identity, date,
  balances, back and remove), `friend-detail-expenses.tsx` (the list), and
  `friend-detail-missing-state.tsx`, with the form, delete and remove
  confirmations in `friend-detail-modals.tsx`. `use-friend-detail-screen.ts`
  composes `useFriendsOverview`, `use-friend-detail-expenses.ts` and
  `use-friend-removal.ts`.
- **Overview-only authority for existence.** `status` is derived as
  `header ? "ready" : loading | error | missing`. The expense list can fail
  without turning a removed/unknown friend into a load error, and the safe
  `FriendDetailMissingState` is shown instead of an empty header. Loading and full
  errors keep a back action through `SocialRouteHeader`.
- **Client-side pair filtering.** `friend-expenses.ts` exposes `isFriendExpense`,
  `filterFriendExpenses` and `getFriendExpenses`, which composes
  `filterActiveExpenses` + `sortSharedExpenses`. `useSharedExpenseList` already
  loads the viewer's active expenses with focus refresh, so the pair is filtered
  in memory.
- **No new query or index.** A per-pair Firestore query would need a composite
  index on `participantIds` + `deletedAt`/date and a second loader; the in-memory
  filter reuses one loader and one refresh path.
- **FAB preselection via `lockedFriendUid`.** `useSharedExpenseEditor` and the
  form accept an optional `lockedFriendUid`; `use-friend-detail-expenses.ts`
  passes `friend.uid`, so `openCreate` produces values with that friend and the
  friend field is locked (`friendLocked`). Edit mode keeps locking the friend.
  Copy: `sharedExpenses:form.friendPreselectedHint` for the create lock,
  `form.friendLockedHint` for editing.
- **Pure helpers.** `features/friends/utils/friend-detail.ts` (`findFriendByUid`,
  `getFriendDetailHeader`) and `features/shared-expenses/utils/friend-expenses.ts`
  keep the lookup, the header summary and the pair filtering testable without
  React, and keep `features/social` free of money rules. Balances reuse
  `getFriendBalanceDirection` + `centsToAmount`, drop zero nets and never convert
  or aggregate currencies.
- **`useSharedExpenseDeletion`** now owns the delete state, the confirmation and
  `actionError`/`pendingId`; `useSharedExpenseList` only loads and refreshes.

## Removal semantics
`removeFriend` (from `useFriendActions`) deletes only the `friendships` document.
It never touches `sharedExpenses`:

- existing expenses stay participant-readable (the read rules are based on
  participation, not on the friendship);
- they lose their only UI entry point, because the detail is reached through the
  friends overview;
- no new expense can be created for that pair without the friendship
  (`NOT_FRIEND`);
- money records are never deleted as a side effect of removing a person.

The action reuses the previous `friends:removeDialog.*` copy, navigates back on
success and the Social tab refreshes on focus. `FriendRow` is now a pressable that
only opens the detail (chevron, no remove); `FriendsList` and
`SocialFriendsSegment` take `onOpen`, and the tab no longer owns removal or its
`ConfirmDialog`.

## Alternatives rejected
- **Per-pair Firestore query + composite index:** deferred. It would add an index
  and a second loader to save one in-memory filter over an already-loaded list.
- **Duplicating the shared-expense form for the friend context:** a `lockedFriendUid`
  input on the existing form is enough, mirroring how edit mode already locks the
  friend.
- **Keeping removal in the row:** the row already opens the detail, and two
  destructive-ish actions in one 48 px row is worse for accessibility and touch
  targets.
- **A second shared-expenses section in the Social tab:** TICKET-041 removed it on
  purpose; the pair context belongs to the detail.

## Consequences
- **Balances follow the overview refresh.** Create, edit and delete call
  `onFriendsChanged` (the overview `refresh`) plus `list.refresh()`, so the header
  debts and the Social list move together.
- **The expense list follows create/edit/delete** through the same callback pair;
  there is no optimistic row state.
- **Missing state after removal.** Revisiting the route after removing the friend
  shows `FriendDetailMissingState`, not an error.
- **Money records untouched.** Removing a friend leaves the ledger intact; the
  balances simply stop being reachable from the UI.
- **Dead code removed.** `SharedExpensesSection`, `shared-expenses-section-header`,
  `shared-expenses-list` and `useSharedExpensesSection` had no remaining consumers
  and were deleted, together with the dead `sharedExpenses` section/add/empty keys
  and their styles.

## Refresh model
- `useFriendsOverview` and `useSharedExpenseList` both refresh on focus (skipping
  the first focus), so another device's changes appear without pull-to-refresh.
- Explicit refresh after mutations: `useFriendDetailExpenses.onChanged` calls
  `list.refresh()` + `onFriendsChanged()`; `useFriendRemoval` passes
  `overview.refresh` as `onChanged`.
- Pull-to-refresh sets one local flag and awaits both sources, because
  `useSharedExpenseList` exposes `refresh` but not its own refreshing state.

## Accessibility and copy
- Back action: `common:accessibility.back` plus `social:routeBackHint`; remove
  action: `friends:friends.removeAccessibility`/`removeHint` (and
  `removingHint` while in flight); every expense row keeps the existing edit and
  delete labels and hints; the FAB has a label including the friend name and a
  hint explaining the preselection.
- `FriendRow` gained `friends:friends.openAccessibility`/`openHint` and shows a
  chevron as the visual affordance.
- New copy lives in `social:friendDetail.*`, `friends:detail.since`,
  `friends:friends.open*` and `sharedExpenses:form.friendPreselectedHint`, with
  es/en parity.

## Verification
`npx tsc --noEmit` pass, `npx expo lint` exit 0, `npx jest` 196 suites / 1028
tests, `npm run check:copy` 209 TSX files and `npm run test:coverage` 99.01 %
statements / 94.74 % branches / 99.03 % functions / 99.49 % lines;
`features/friends/utils/friend-detail.ts` and
`features/shared-expenses/utils/friend-expenses.ts` at 100 %.

## Open items
- **Manual emulator validation is pending:** light/dark, es/en, screen-reader
  labels, the FAB create flow and the two-account removal were not exercised in
  this session (no device).
- The `publicProfiles`, `friendRequests`, `friendships` and `sharedExpenses` rules
  are still **undeployed** since TICKET-007/TICKET-009.
- TICKET-043 owns the expense row tap (shared-expense detail route); the rows keep
  edit/delete today.
- TICKET-046 adds the **Liquidar deudas** action to this header.
- The per-pair query and its composite index stay deferred until a real list-size
  problem appears.
