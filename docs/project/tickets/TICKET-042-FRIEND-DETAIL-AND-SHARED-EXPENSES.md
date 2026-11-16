# TICKET-042 - Friend Detail Screen with Shared Expenses

**Type:** Feature / UX  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** PM-003, PM-006; TICKET-007, TICKET-009, TICKET-041, TICKET-043, TICKET-046  
**Sprint:** Post-MVP / Phase 5.1

## Description
Give every accepted friend a dedicated screen at `/social/friends/[uid]` that replaces the shared-expenses section of the old tab: header with identity, friendship date and per-currency balances, the remove-friend action, and the list of shared expenses with that friend. The FAB opens the shared-expense form with the friend preselected, so a 1:1 expense is created from the friend context instead of a picker in a tab.

## Requirements
- [ ] Add the `/social/friends/[uid]` route (`app/social/friends/[uid].tsx`) and open it when a friend row in the Social tab is tapped
- [ ] Build the header with the friend name, email, friendship since date (when available), back navigation and the derived balance lines grouped per currency, reusing `getFriendBalanceDirection` and `centsToAmount`
- [ ] Add the remove-friend action in the top-right corner with the existing confirmation copy, call `removeFriend` from `useFriendActions`, refresh the Social tab and navigate back on success
- [ ] Keep a safe missing state: when the uid no longer resolves to a friend after loading, show a "friend not found / removed" state with a way back instead of an empty header
- [ ] List below the header the active shared expenses between the viewer and that friend, newest first, showing the total, the payer and the viewer share, with edit and delete actions
- [ ] Add loading, error with retry, empty and pull-to-refresh states, and refresh the friend and its expenses when the screen regains focus
- [ ] Add a FAB whose `+` opens the shared-expense form with the friend preselected and the friend field locked or hidden in that entry point
- [ ] Reuse `SharedExpenseFormModal` and `useSharedExpenseEditor`; add an optional locked-friend input instead of duplicating the form, mirroring how edit mode already locks the friend
- [ ] Extract a reusable `FriendSharedExpensesList` in `features/shared-expenses/components/` that renders the filtered expenses without a friend picker and without a section header
- [ ] Remove `SharedExpensesSection` from the Social tab (it must not be mounted in the tab after this ticket)
- [ ] Move the friend-removal action out of `FriendRow`: the row only opens the friend detail and no longer renders the remove button
- [ ] Keep the current edit/delete actions on the expense rows; TICKET-043 switches the row tap to the expense detail route
- [ ] Add accessibility roles, labels and hints for the back action, the remove action, the FAB and every expense row action
- [ ] Keep every visible string, including accessibility copy, in the es/en namespaces and pass `npm run check:copy`
- [ ] Add pure helpers with colocated tests for the friend lookup and header summary (`findFriendByUid`, `getFriendDetailHeader`) and for the friend expense filtering/sorting; do not aggregate different currencies
- [ ] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [ ] Tapping a friend in the Social tab opens `/social/friends/[uid]` with that friend's data
- [ ] The header shows name, email, friendship since and one balance line per currency
- [ ] The top-right remove action asks for confirmation, deletes the friendship, refreshes the Social tab and returns to it
- [ ] Only the active shared expenses between the viewer and that friend are listed, newest first
- [ ] The FAB creates a shared expense for that friend without asking to pick a friend
- [ ] The Social tab no longer shows the **Gastos compartidos** section
- [ ] The friend row no longer renders the remove action and only opens the detail
- [ ] A removed or unknown friend shows a safe state instead of a broken header
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Technical Notes
- **Route naming:** `/social/friends/[uid]` keeps the friend resource under the `social` segment that TICKET-041 adds to `PRIVATE_SEGMENTS`. The uid is read with `useLocalSearchParams`; it is never used to build a Firestore path, only to filter the loaded overview.
- **Data source:** `useFriendsOverview({ viewerUid })` already returns every friend with `since` and `balances[]`, and `useSharedExpenseList({ viewerUid })` already loads the viewer's active expenses with focus refresh. Compose both and filter, instead of adding a new repository query; a per-pair query would need a composite index and is deferred.
- **Pure helpers:** `features/friends/utils/friend-detail.ts` resolves the friend (`findFriendByUid`) and the header data (`getFriendDetailHeader`, with the email/name fallback); `features/shared-expenses/utils/friend-expenses.ts` filters by pair and sorts newest first. Both are testable without React and keep `features/social` free of money rules.
- **Preselected friend:** extend `useSharedExpenseEditor` and `SharedExpenseFormModal`/`SharedExpenseForm` with an optional `lockedFriendUid`. When set, `createSharedExpenseFormValues` receives that uid and `SharedExpenseFriendField` is hidden or disabled with the existing locked hint. Edit mode already has the same shape, so no second form is needed.
- **Removing a friend:** `removeFriend` deletes the friendship document but does **not** touch `sharedExpenses`. Existing expenses stay participant-readable while no new expense can be created (`NOT_FRIEND`), and after this ticket they lose their only UI entry point once the friend disappears. Document the chosen behaviour in the `Implemented` section; never delete money records as a side effect of removing a friend.
- **Balances:** the header reuses `Friend.balances[]`, which is already grouped per currency and never converted; do not sum lines of different currencies and do not recompute the ledger in the screen.
- **Copy:** identity and balance strings stay in the `friends` namespace, expense strings in `sharedExpenses`; only the screen-level labels that are genuinely new (title, empty/missing state, FAB label) go to `social`.
- **TICKET-046:** the settlement entry point planned for this screen is specified in `docs/project/tickets/TICKET-046-FRIEND-SETTLEMENT.md`; it adds the **Liquidar deudas** action to the header.
- **Out of scope:** TICKET-043 (expense detail route and row tap), TICKET-044 (wallet/movement link shown in the expense detail), TICKET-046 (settlement button), group expenses and any change to the split math, schema, service or Firestore rules.

## Validation Plan
- Open the detail from the Social tab with a friend that has no expenses, one expense and several expenses in different currencies.
- Verify the FAB creates an expense for the preselected friend and that the list and the Social balances refresh after create, edit and delete.
- Remove a friend from the detail, confirm the dialog and confirm the Social tab no longer lists the friend and the route shows the missing state when revisited.
- Check light/dark mode and Spanish/English, including screen-reader labels.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-041 Social tab shell, add-friend screen and pending requests
- TICKET-007 Friends and requests (delivered)
- TICKET-009 1:1 shared expenses (delivered)
