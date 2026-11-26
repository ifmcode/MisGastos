# TICKET-075 - Remove Pull-to-Refresh from Every List

**Type:** UX / small task  
**Priority:** Medium (pre-V1)  
**Status:** ⏳ Queued  
**Related:** TICKET-002, TICKET-003, TICKET-025, TICKET-026, TICKET-033, TICKET-041, TICKET-042, TICKET-047, TICKET-059, TICKET-072, TICKET-073  
**Sprint:** V1 / Phase 8

## Description
Dragging down from the top of a list reloads the screen and loses the scroll position and the current state. Remove the pull-to-refresh gesture from every screen. Decision closed: **no manual refresh alternative** — no refresh button is added; the refresh on focus/tab return and after create, edit or delete stays exactly as it is today. No data, repository, rule or offline-engine change is involved.

## Requirements
### Gesture removal
- [ ] Remove `refreshControl` from the dashboard `ScrollView` (`features/dashboard/components/dashboard-overview-scroll.tsx`) and the `refreshing`/`onRefresh` props it receives from `features/dashboard/components/dashboard-screen.tsx`
- [ ] Remove `refreshing`/`onRefresh` from every `FlatList`/`SectionList` and from the screen → body/list chain: Movimientos (`features/transactions/components/transactions-screen.tsx`, `transactions-body.tsx`, `transactions-list.tsx`), Carteras (`features/wallets/components/wallets-screen.tsx`, `wallets-list.tsx`), Categorías (`features/categories/components/categories-screen.tsx`, `categories-list.tsx`), Historial de transferencias (`features/transfers/components/transfer-history-screen.tsx`), Social (`features/social/components/social-screen.tsx`), Detalle de amigo (`features/social/components/friend-detail-screen.tsx`), Peticiones (`features/social/components/requests-screen.tsx`), Añadir amigo (`features/social/components/add-friend-screen.tsx`), Detalle de grupo (`features/groups/components/group-detail-screen.tsx`, `group-detail-content.tsx`), Notificaciones (`features/notifications/components/notifications-screen.tsx`, `notifications-list.tsx`)

### State and copy cleanup
- [ ] Remove the `refreshing` state and props and the functions that exist **only** for the gesture
- [ ] Keep the focus refresh, the retry `reload`, the per-section retry buttons and any `refresh` still used by another path
- [ ] Add no alternative refresh button or gesture
- [ ] Update the component/hook tests that assert `onRefresh`/`refreshing`, if any, and delete accessibility copy left without a consumer; `npm run check:copy` must pass
- [ ] Keep the loading, error and empty states and their retries unchanged

## Acceptance Criteria
- [ ] Dragging down on any list neither reloads it nor shows the refresh spinner
- [ ] Returning to a tab still refreshes as it does today
- [ ] Creating, editing and deleting still refresh the affected lists
- [ ] The error retry buttons still work
- [ ] No unused props, state or copy remain, and `tsc`, `lint`, `jest` and `check:copy` are clean

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
