# Pull-to-refresh removal (TICKET-075)

> Date: 27/11/2026
> Status: Delivered — TICKET-075 is `✅ Done (27/11/2026)`.
> Related: `roadmap.md` Phase 8, `tickets/[DONE] TICKET-075-FUTURE-PULL-TO-REFRESH-REMOVAL.md`,
> the closed "no manual refresh" decision and `project-memory.md`.

## Context

Dragging down from the top of a list reloaded the screen and lost the scroll
position and the current state. Every list and the dashboard scroll view carried
the gesture through `RefreshControl`/`refreshControl` or the `FlatList`
`onRefresh`/`refreshing` pair, and the hooks exposed a `refreshing` field that
only fed the spinner.

## Decision

Remove the gesture from every list and screen with **no manual refresh
alternative**: no refresh button and no replacement gesture. The refresh on
focus/tab return, the reconnect reload, the refresh after create/edit/delete,
the `reload` retries, the per-section retry buttons, `loadMore` and the
loading/error/empty states stay exactly as they were. No data, repository,
rule, index or offline-engine change is involved.

## Delivered

### UI layer

- The `RefreshControl`/`refreshControl` gesture and the `FlatList`
  `onRefresh`/`refreshing` props left the dashboard `ScrollView`, Movimientos,
  Carteras, Categorías, Historial de transferencias, Social, Detalle de amigo,
  Peticiones, Añadir amigo, Detalle de grupo and Notificaciones, including the
  screen → body/list prop chains (`transactions-screen.tsx`,
  `transactions-body.tsx`, `transactions-list.tsx`, `wallets-screen.tsx`,
  `wallets-list.tsx`, `categories-screen.tsx`, `categories-list.tsx`,
  `transfer-history-screen.tsx`, `social-screen.tsx`,
  `friend-detail-screen.tsx`, `requests-screen.tsx`, `add-friend-screen.tsx`,
  `group-detail-screen.tsx`, `group-detail-content.tsx`,
  `notifications-screen.tsx`, `notifications-list.tsx` and
  `dashboard-overview-scroll.tsx`).
- No refresh button or alternative gesture was introduced, and no copy was added
  for one.

### Hooks and state

- The `refreshing` state/field left `shared/hooks/use-async-collection.ts` and
  the hooks that only exposed it for the spinner: wallets, categories,
  transactions, transfers, friends overview, groups, group invitations, owner
  join requests, group detail, group activity feed, group balances, group
  balance summaries, group expenses and the `SocialGroupsController`
  aggregation.
- Gesture-only callbacks were deleted: `refreshAll` in `useDashboardRefresh`
  (with its `categories` source), `refreshAll` in `useTransactionsScreen`, the
  composed `refresh` of transfer history, friend detail, group detail,
  notifications, requests and add friend (`canRefresh`), and the unused
  `refresh` re-export of `useNotifications`. `refreshAll` stays private in
  `useSocialScreen` because the requests-refresh store uses it.
- The dashboard movements retry now composes `retryMovements()` plus
  `categoriesState.reload()` in `dashboard-screen.tsx`, because the categories
  source left `useDashboardRefresh`; behaviour is the same as before.

### Loading race

- Background refreshes keep the silent load mode, and their `finally` now clears
  `loading` for the current request instead of only for the initial one, so a
  refresh that overtakes the initial load cannot leave a screen stuck in its
  loading state. `useGroupActivityFeed` already had the safe variant.

### Tests

- `features/dashboard/utils/__tests__/dashboard-refresh.test.ts` dropped the
  case that only asserted the gesture refreshed categories; the gate and
  promise cases remain.

## Review findings

The pre-close `reviewer` returned **`changes requested`** for two findings, both
fixed:

- the `loading` race above (a background refresh could leave a screen loading);
- the dead social `refresh` callback.

The remaining nits were either applied (notifications re-export, stale
activity-feed comment) or accepted: `use-async-collection.ts` stays at 154 lines
against the 150 soft limit because it was already longer and this ticket removes
behaviour instead of adding it.

## Verification (27/11/2026)

- `npx tsc --noEmit` and `npx expo lint`: clean.
- `npx jest`: **477 suites / 3245 tests**.
- `npm run test:coverage`: **96.49 % statements, 90.14 % branches,
  97.54 % functions, 97.53 % lines**.
- `npm run check:copy`: passed (**358 TSX**).
- A repo-wide grep for `refreshing|onRefresh|refreshControl|RefreshControl` in
  source returns **0 matches**.

## Accepted consequences

- The dashboard's recent-movement category names refresh on mount, reconnect and
  the movements retry, not on focus. That matches the pre-ticket focus policy and
  the closed "no manual refresh" decision.
- `use-async-collection.ts` stays at 154 lines against the 150 soft limit, as
  described in the review findings.
- With no manual refresh, a screen whose focus refresh failed keeps its retry
  buttons as the only way to recover; that is the intended behaviour.

## Pending manual steps

- Manual device/simulator validation is pending: drag on every list, tab-return
  refresh, create/edit/delete of each record, forced error retries and the web
  build.

## Next ticket

TICKET-052 — push notifications for background and closed app.
