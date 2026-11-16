# [DONE] TICKET-041 - Social Tab Shell, Add-Friend Screen and Pending Requests

**Type:** UX / Feature  
**Priority:** High  
**Status:** ✅ Done (16/11/2026)  
**Related:** PM-003; TICKET-007, TICKET-042, TICKET-043, TICKET-045, TICKET-008  
**Sprint:** Post-MVP / Phase 5.1

## Description
Turn the **Amigos** tab into a **Social** tab that orchestrates the friends domain and leaves room for groups, move account discovery and request management out of the tab into two dedicated routes, and turn pending requests into a visible entry point. The tab becomes a small hub: a pending-requests row, a **Tus amigos / Tus grupos** switch, the friends list and a FAB whose menu will also host the group actions in Phase 6.

## Requirements
- [x] Rename the tab copy to **Social**: add `tabs.social` to the `navigation` es/en files and remove `tabs.friends`, so no dead key stays behind
- [x] Replace `app/(tabs)/friends.tsx` with `app/(tabs)/social.tsx` and register `social` in `app/(tabs)/_layout.tsx`, keeping the `person.2.fill` icon and the same tab position until groups exist
- [x] Add `social` to `PRIVATE_SEGMENTS` in `features/auth/utils/auth-redirect.ts`, so the tab and the new `/social/*` routes keep the unverified-email guard
- [x] Create `features/social/` with `components/`, `hooks/`, `utils/`, `styles/`, `locales/{es,en}.json` as the shell that composes friends now and groups later; `features/friends` keeps its domain (types, schemas, services, repositories, balance utils)
- [x] Build the Social screen with a header, the **Peticiones pendientes** summary row, the segmented control, the friends list and the FAB
- [x] The pending row is always rendered and tappable; it shows a count of incoming + outgoing requests whose status is `pending`, and the badge is only rendered when the count is greater than 0. Tapping it opens `/social/requests`
- [x] The segmented control offers **Tus amigos** and **Tus grupos**; **Tus amigos** renders the current friends list with its balances unchanged, **Tus grupos** renders a coming-soon empty state and no group action
- [x] Add `FabActionMenu` in `shared/components/molecules` (component + styles) as a reusable action menu: `visible`, a translated `title`, `onClose` and an `actions` array of `{ key, label, icon, hint?, disabled?, onPress }`
- [x] The Social FAB opens `FabActionMenu` with exactly one action, **Añadir amigo**, which navigates to `/social/add-friend`; **Crear grupo** and **Unirse a grupo** are not rendered in this ticket
- [x] Add the `/social/add-friend` route (`app/social/add-friend.tsx`) with the **Buscar por email** form and its result moved out of the tab, reusing `useFriendSearch`, `FriendSearchForm`, `FriendSearchResult` and `FriendSearchEmpty`
- [x] Sending a request from `/social/add-friend` refreshes the pending count (focus refresh on the Social tab plus an explicit callback from the route), and the back action returns to the Social tab
- [x] Add the `/social/requests` route (`app/social/requests.tsx`) listing **recibidas** and **enviadas** with accept, reject and cancel, reusing `FriendRequestSection` and the existing `useFriendActions` operations
- [x] The requests screen counts and renders only `pending` requests and shows an empty state when there are none
- [x] Remove the search form, the request sections and the shared-expenses section from the Social tab
- [x] Do not change `FriendRow` behaviour: removal stays in the row until TICKET-042 moves it to the friend detail, and the row does not navigate yet
- [x] Cover loading, error with retry, empty and pull-to-refresh on every screen, and refresh friends/requests when the screen regains focus
- [x] Add accessibility roles, labels and hints for the segmented control (`tablist`/`tab` plus selected state), the pending row and its badge, the FAB, every menu action and the back action
- [x] Keep every visible string, including accessibility copy, in the `social` or `navigation` namespaces with es/en parity; no string is inline and `npm run check:copy` passes
- [x] Add the pending-count logic as a pure helper (for example `features/social/utils/pending-requests.ts`) with colocated tests, and do not duplicate search or request logic in the new screens
- [x] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [x] The **Social** tab shows the pending-requests row, the segmented control and the friends list in the **Tus amigos** segment
- [x] The **Tus grupos** segment shows a coming-soon empty state and renders no group action
- [x] The pending row count equals the received plus sent `pending` requests, and the badge is hidden when that count is 0
- [x] `/social/add-friend` searches by email and sends a request, and the Social tab reflects the new outgoing request on return
- [x] `/social/requests` accepts, rejects and cancels requests, and the pending count on the Social tab follows
- [x] The social surface no longer renders the search form, the request sections or the shared-expenses section
- [x] **Crear grupo** and **Unirse a grupo** are not rendered anywhere in the Social FAB menu
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Implemented

### Delivered files
- **Routes:** `app/(tabs)/social.tsx` renders `SocialScreen`; `app/(tabs)/friends.tsx` is deleted and `app/(tabs)/_layout.tsx` registers `social` with `tabs.social`, the `person.2.fill` icon and the same tab position. `app/social/add-friend.tsx` and `app/social/requests.tsx` are the two sibling routes; `features/auth/components/auth-navigator.tsx` declares both with `headerShown: false`, and `social` joined `PRIVATE_SEGMENTS` in `features/auth/utils/auth-redirect.ts`, with the auth-redirect tests covering anonymous, unverified and verified users.
- **Feature:** `features/social/types/social.types.ts`; `features/social/utils/pending-requests.ts` (`getPendingRequests`, `countPendingRequests`) and `features/social/utils/requests-refresh-store.ts` (subscribe/notify), both with colocated tests; hooks `use-social-screen.ts`, `use-requests-screen.ts` and `use-add-friend-screen.ts`; components `social-screen.tsx`, `social-header.tsx`, `social-pending-row.tsx`, `social-segment-control.tsx`, `social-friends-segment.tsx`, `social-groups-segment.tsx`, `social-route-header.tsx`, `social-fab.tsx`, `add-friend-screen.tsx` and `requests-screen.tsx`; `styles/social.styles.ts`; `locales/{es,en}.json`, registered in `shared/i18n/resources.ts` with es/en parity.
- **Shared:** `shared/components/molecules/fab-action-menu.tsx` + `fab-action-menu.styles.ts`; `Fab` gained an optional `accessibilityHint`. `tabs.friends` left the `navigation` namespace and `tabs.social` replaced it.

### Social hub
- Header, an always-rendered pending row (incoming + outgoing `pending` count, badge only when > 0, opens `/social/requests`), the **Tus amigos** / **Tus grupos** `tablist`, the friends list with its existing per-currency balances and remove action, and a FAB with exactly one action, **Añadir amigo** (no **Crear grupo** / **Unirse a grupo**).
- **Tus grupos** renders a coming-soon `EmptyState` with no action.
- The search form, the request sections and the shared-expenses section are no longer rendered in the tab. `FriendRow` is unchanged: removal stays in the row and the row does not navigate (TICKET-042).

### Routes
- `/social/add-friend` reuses `useFriendSearch`, `FriendSearchForm`, `FriendSearchResult`, `FriendSearchEmpty` and the existing request-send action. Pull-to-refresh re-runs the search once an email exists; there is no bootstrap list, so the screen has no initial full-screen loader. A successful send marks the relation outgoing and notifies the Social tab through the route callback passed as `onRequestSent`.
- `/social/requests` reuses `FriendRequestSection` + `useFriendActions`, lists only pending incoming/outgoing requests, supports accept/reject/cancel, and has loading, full-screen error with retry, empty state, pull-to-refresh and focus refresh.

### `FabActionMenu` API
```ts
interface FabActionMenuAction {
  key: string;
  label: string;        // already translated
  icon: IoniconsName;
  hint?: string;        // already translated, rendered under the label
  disabled?: boolean;
  onPress: () => void;
}

interface FabActionMenuProps {
  visible: boolean;
  title: string;        // already translated
  onClose: () => void;
  actions: readonly FabActionMenuAction[];
}
```
Transparent `Modal` (`overFullScreen`, `fade`, `statusBarTranslucent`, `onRequestClose`), backdrop that closes, themed card with safe-area padding, one accessible row per action (`accessibilityRole="button"` + `accessibilityState.disabled`), disabled rendering and close-then-`onPress` ordering. The menu knows nothing about friends or groups.

### Pending count and refresh
- `getPendingRequests` keeps the overview order, drops every non-`pending` status and returns `{ incoming, outgoing, total }`; `countPendingRequests` exposes the same number to the row badge, so the badge and the `/social/requests` list cannot drift. Tests cover the filtering, the single total and the empty overview.
- `useFriendsOverview` refreshes on focus, and `requests-refresh-store` provides the explicit route callback from `/social/add-friend` in addition to it.
- A failed background refresh keeps the existing data and shows an `ErrorBanner`; the full-screen `ErrorState` only appears when there is no data to show.

### Accessibility and copy
- `tablist`/`tab` roles with selected state on the segment control, label and hint on the pending row (the count is part of the row label, so the badge is visual only), the FAB, every menu action (including disabled state) and the route back action.
- Every visible string, accessibility copy included, lives in the `social` or `navigation` namespaces with es/en parity.

### Cleanup
- Deleted `features/friends/components/friends-screen.tsx`, `friends-header.tsx` and `features/friends/hooks/use-friends-screen.ts`.
- Removed the unused `friends` root copy keys (`title`, `subtitle`, `loading`, `errorTitle`, `retryAccessibility`) and the unused `friendsStyles.container`/`scrollContent`.

### Accepted gap
- Removing the shared-expenses section leaves no entry point to create a 1:1 expense until TICKET-042 mounts it in the friend detail. TICKET-041 and TICKET-042 must ship together, or the gap must be stated explicitly. The Social tab has no 1:1 expense entry point today.

### Verification (16/11/2026, Node 24)
- `npx tsc --noEmit`: pass, no output.
- `npx expo lint`: pass, exit 0 (only the Expo `.env` banner).
- `npx jest`: 194 suites / 1004 tests passed.
- `npm run check:copy`: pass, 204 TSX files.
- `npm run test:coverage`: 99.00% statements, 94.70% branches, 99.01% functions, 99.49% lines; `features/social/utils` at 100%.
- Reviewer verdict: `approve with nits`, no blockers. The code nits (dead keys/styles, badge grouping, add-friend refresh feedback, background-refresh error, requests loading copy, action callback deps, memoized pending count, hoisted remove error banner) were fixed before this docs pass.
- **Pending:** manual emulator validation (light/dark, Spanish/English, two accounts, iOS modal close-then-navigate) was not run because no device was available in this session.
- Development note: [`2026-11-16-social-tab.md`](../development-notes/2026-11-16-social-tab.md).

## Technical Notes
- **Route structure:** `app/social/add-friend.tsx` and `app/social/requests.tsx` are siblings of the tabs group. The auth guard reads `segments[0]`, so `social` must join `PRIVATE_SEGMENTS`; if the explicit `<Stack.Screen>` list in `features/auth/components/auth-navigator.tsx` is kept, declare `headerShown: false` for the new `social/*` routes there.
- **Feature split:** `features/social` owns the hub, the segment state, the pending row, the add-friend screen composition and the requests composition. `features/friends` keeps `FriendsService`, the schemas, the repositories and the balance utils. The tab route imports the social screen, not `FriendsScreen`.
- **`FabActionMenu` API:** the menu knows nothing about friends or groups. Each action receives already translated `label`/`hint` and an `Ionicons` name, plus an optional `disabled`; the component renders a transparent `Modal` with a backdrop that closes on press/back, a themed card with one pressable row per action and `accessibilityRole="button"`/`accessibilityState`. Group actions are simply absent from the array until Phase 6.
- **Why a shared menu:** one menu reused by Social today and by groups later avoids a one-off overlay per screen, keeps the FAB/theme/a11y behaviour in one place and gives TICKET-040 a component to catalog. A `ActionSheetIOS` call is rejected because the project targets Android and web too.
- **Pending counts:** the overview already separates `incoming`/`outgoing`; the pure helper only counts `status === "pending"` and returns the total, so the badge and the row share one number and the UI cannot drift from the list.
- **Reuse instead of copies:** `/social/add-friend` composes `useFriendSearch` and the three existing search components; `/social/requests` composes `FriendRequestSection` with `useFriendActions`. No new service, schema or repository is needed.
- **Sequencing:** removing the **Gastos compartidos** section leaves the app without a shared-expense entry point until TICKET-042 mounts it in the friend detail. Ship 041 and 042 in the same demo/release, or accept that gap explicitly.
- **TICKET-045:** consumes `FabActionMenu` from the movements FAB (`docs/project/tickets/TICKET-045-MOVEMENTS-CREATE-MENU.md`); keep the menu API (`visible`, `title`, `onClose`, `actions`) stable so both screens share one component.
- **Out of scope:** TICKET-042 (friend detail and shared expenses), TICKET-043 (expense detail), TICKET-044 and TICKET-046 (wallet/movement link and settlement), groups, notifications, blocking users and any change to the friends service, rules or balance math.

## Validation Plan
- Manually exercise the Social tab, the segment switch, the pending row with 0/1/several requests, the add-friend screen and the requests screen on the emulator, in light and dark mode, and in Spanish and English.
- Confirm with two accounts that a request sent from one device shows up in the other's pending count after the focus refresh.
- Verify the auth guard by navigating to `/social/add-friend` and `/social/requests` with an unverified email/password account.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-007 Friends and requests (delivered)
- TICKET-009 1:1 shared expenses (delivered; its section moves to TICKET-042)
- TICKET-008 Groups (Phase 6; consumes this shell, not a blocker for 041)
