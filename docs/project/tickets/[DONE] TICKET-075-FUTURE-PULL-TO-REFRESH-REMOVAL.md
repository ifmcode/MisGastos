# [DONE] TICKET-075 - Remove Pull-to-Refresh from Every List

**Type:** UX / small task  
**Priority:** Medium (pre-V1)  
**Status:** ✅ Done (27/11/2026)  
**Related:** TICKET-002, TICKET-003, TICKET-025, TICKET-026, TICKET-033, TICKET-041, TICKET-042, TICKET-047, TICKET-059, TICKET-072, TICKET-073  
**Sprint:** V1 / Phase 8

## Description
Dragging down from the top of a list reloads the screen and loses the scroll position and the current state. Remove the pull-to-refresh gesture from every screen. Decision closed: **no manual refresh alternative** — no refresh button is added; the refresh on focus/tab return and after create, edit or delete stays exactly as it is today. No data, repository, rule or offline-engine change is involved.

## Requirements
### Gesture removal
- [x] Remove `refreshControl` from the dashboard `ScrollView` (`features/dashboard/components/dashboard-overview-scroll.tsx`) and the `refreshing`/`onRefresh` props it receives from `features/dashboard/components/dashboard-screen.tsx`
- [x] Remove `refreshing`/`onRefresh` from every `FlatList`/`SectionList` and from the screen → body/list chain: Movimientos (`features/transactions/components/transactions-screen.tsx`, `transactions-body.tsx`, `transactions-list.tsx`), Carteras (`features/wallets/components/wallets-screen.tsx`, `wallets-list.tsx`), Categorías (`features/categories/components/categories-screen.tsx`, `categories-list.tsx`), Historial de transferencias (`features/transfers/components/transfer-history-screen.tsx`), Social (`features/social/components/social-screen.tsx`), Detalle de amigo (`features/social/components/friend-detail-screen.tsx`), Peticiones (`features/social/components/requests-screen.tsx`), Añadir amigo (`features/social/components/add-friend-screen.tsx`), Detalle de grupo (`features/groups/components/group-detail-screen.tsx`, `group-detail-content.tsx`), Notificaciones (`features/notifications/components/notifications-screen.tsx`, `notifications-list.tsx`)

### State and copy cleanup
- [x] Remove the `refreshing` state and props and the functions that exist **only** for the gesture
- [x] Keep the focus refresh, the retry `reload`, the per-section retry buttons and any `refresh` still used by another path
- [x] Add no alternative refresh button or gesture
- [x] Update the component/hook tests that assert `onRefresh`/`refreshing`, if any, and delete accessibility copy left without a consumer; `npm run check:copy` must pass
- [x] Keep the loading, error and empty states and their retries unchanged

## Acceptance Criteria
- [x] Dragging down on any list neither reloads it nor shows the refresh spinner
- [x] Returning to a tab still refreshes as it does today
- [x] Creating, editing and deleting still refresh the affected lists
- [x] The error retry buttons still work
- [x] No unused props, state or copy remain, and `tsc`, `lint`, `jest` and `check:copy` are clean

## Implemented

The gesture is gone from every list and screen; nothing replaced it. The silent
refresh paths (focus/tab return, reconnect, after create/edit/delete and the
retry buttons) keep working.

### Removed from the UI

- `RefreshControl`/`refreshControl` and the `FlatList` `onRefresh`/`refreshing`
  props left the dashboard `ScrollView`, Movimientos, Carteras, Categorías,
  Historial de transferencias, Social, Detalle de amigo, Peticiones, Añadir
  amigo, Detalle de grupo and Notificaciones, including the screen → body/list
  prop chains (`transactions-screen.tsx`, `transactions-body.tsx`,
  `transactions-list.tsx`, `wallets-screen.tsx`, `wallets-list.tsx`,
  `categories-screen.tsx`, `categories-list.tsx`, `transfer-history-screen.tsx`,
  `social-screen.tsx`, `friend-detail-screen.tsx`, `requests-screen.tsx`,
  `add-friend-screen.tsx`, `group-detail-screen.tsx`,
  `group-detail-content.tsx`, `notifications-screen.tsx`,
  `notifications-list.tsx` and `dashboard-overview-scroll.tsx`).

### Removed from the hooks

- The `refreshing` state/field left `shared/hooks/use-async-collection.ts` and
  the hooks that only exposed it for the spinner: wallets, categories,
  transactions, transfers, friends overview, groups, group invitations, owner
  join requests, group detail, group activity feed, group balances, group
  balance summaries, group expenses and the `SocialGroupsController`
  aggregation.
- The gesture-only callbacks were deleted: `refreshAll` in
  `useDashboardRefresh` (with its `categories` source), `refreshAll` in
  `useTransactionsScreen`, the composed `refresh` of transfer history, friend
  detail, group detail, notifications, requests and add friend (`canRefresh`),
  and the unused `refresh` re-export of `useNotifications`. `refreshAll` stays
  private in `useSocialScreen` because the requests-refresh store uses it.

### Refresh behaviour that stayed

- Background refreshes keep the silent load mode, and their `finally` now
  clears `loading` for the current request instead of only for the initial one,
  so a refresh that overtakes the initial load cannot leave a screen stuck in
  its loading state. `useGroupActivityFeed` already had the safe variant.
- Unchanged: focus/tab-return refresh, reconnect refresh,
  after-create/edit/delete refresh, `reload` retries, per-section retry buttons,
  `loadMore` and every loading/error/empty state. No refresh button or
  replacement gesture was added.
- Dashboard movements retry composes `retryMovements()` plus
  `categoriesState.reload()` in `dashboard-screen.tsx`, because the categories
  source left `useDashboardRefresh`; the behaviour is the same as before.

### Tests and review

- `features/dashboard/utils/__tests__/dashboard-refresh.test.ts` dropped the
  case that only asserted the gesture refreshed categories; the gate and
  promise cases remain.
- Verification: `npx tsc --noEmit` clean, `npx expo lint` clean, `npx jest`
  477 suites / 3245 tests passed, `npm run test:coverage` 96.49 % statements /
  90.14 % branches / 97.54 % functions / 97.53 % lines, `npm run check:copy`
  passed (358 TSX) and a repo-wide grep for
  `refreshing|onRefresh|refreshControl|RefreshControl` in source returns 0
  matches.
- Pre-close `reviewer` verdict: `changes requested` for two findings, both
  fixed (the `loading` race above and the dead social `refresh`). The remaining
  nits were either applied (notifications re-export, stale activity-feed
  comment) or accepted: `use-async-collection.ts` stays at 154 lines against
  the 150 soft limit because it was already longer and this ticket removes
  behaviour instead of adding it.
- Accepted consequence: the dashboard's recent-movement category names refresh
  on mount, reconnect and the movements retry, not on focus. That matches the
  pre-ticket focus policy and the closed "no manual refresh" decision.
- Manual device/simulator validation is pending: drag on every list, tab-return
  refresh, create/edit/delete of each record, forced error retries and the web
  build.

Session note: [`2026-11-27-pull-to-refresh-removal.md`](../development-notes/session-notes/2026-11-27-pull-to-refresh-removal.md)

## Technical Notes
- Today the gesture comes from `FlatList.onRefresh` + `refreshing` (which make React Native render an implicit `RefreshControl`) and from `ScrollView.refreshControl` on the dashboard.
- `useAsyncCollection` (`shared/hooks/use-async-collection.ts`) exposes `refresh` and `reload`; do not delete `reload` (retry) or a `refresh` still used by the focus refresh.
- Estimate: **2-3 h**, low risk, ~18 UI files.
- Out of scope: changing the focus-refresh policy, adding a manual refresh and touching the offline engine.

## Validation Plan
- Open every affected screen, drag down at the top and confirm there is no spinner and no reload; keep the scroll position.
- Leave and return to each tab and confirm the focus refresh still updates the data.
- Create, edit and delete a movement, a wallet, a category, a transfer, a shared expense and a group item, and confirm the affected lists refresh.
- Force an error state and confirm the retry buttons still work.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.
