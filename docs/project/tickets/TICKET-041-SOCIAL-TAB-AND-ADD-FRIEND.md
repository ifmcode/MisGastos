# TICKET-041 - Social Tab Shell, Add-Friend Screen and Pending Requests

**Type:** UX / Feature  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** PM-003; TICKET-007, TICKET-042, TICKET-043, TICKET-045, TICKET-008  
**Sprint:** Post-MVP / Phase 5.1

## Description
Turn the **Amigos** tab into a **Social** tab that orchestrates the friends domain and leaves room for groups, move account discovery and request management out of the tab into two dedicated routes, and turn pending requests into a visible entry point. The tab becomes a small hub: a pending-requests row, a **Tus amigos / Tus grupos** switch, the friends list and a FAB whose menu will also host the group actions in Phase 6.

## Requirements
- [ ] Rename the tab copy to **Social**: add `tabs.social` to the `navigation` es/en files and remove `tabs.friends`, so no dead key stays behind
- [ ] Replace `app/(tabs)/friends.tsx` with `app/(tabs)/social.tsx` and register `social` in `app/(tabs)/_layout.tsx`, keeping the `person.2.fill` icon and the same tab position until groups exist
- [ ] Add `social` to `PRIVATE_SEGMENTS` in `features/auth/utils/auth-redirect.ts`, so the tab and the new `/social/*` routes keep the unverified-email guard
- [ ] Create `features/social/` with `components/`, `hooks/`, `utils/`, `styles/`, `locales/{es,en}.json` as the shell that composes friends now and groups later; `features/friends` keeps its domain (types, schemas, services, repositories, balance utils)
- [ ] Build the Social screen with a header, the **Peticiones pendientes** summary row, the segmented control, the friends list and the FAB
- [ ] The pending row is always rendered and tappable; it shows a count of incoming + outgoing requests whose status is `pending`, and the badge is only rendered when the count is greater than 0. Tapping it opens `/social/requests`
- [ ] The segmented control offers **Tus amigos** and **Tus grupos**; **Tus amigos** renders the current friends list with its balances unchanged, **Tus grupos** renders a coming-soon empty state and no group action
- [ ] Add `FabActionMenu` in `shared/components/molecules` (component + styles) as a reusable action menu: `visible`, a translated `title`, `onClose` and an `actions` array of `{ key, label, icon, hint?, disabled?, onPress }`
- [ ] The Social FAB opens `FabActionMenu` with exactly one action, **Añadir amigo**, which navigates to `/social/add-friend`; **Crear grupo** and **Unirse a grupo** are not rendered in this ticket
- [ ] Add the `/social/add-friend` route (`app/social/add-friend.tsx`) with the **Buscar por email** form and its result moved out of the tab, reusing `useFriendSearch`, `FriendSearchForm`, `FriendSearchResult` and `FriendSearchEmpty`
- [ ] Sending a request from `/social/add-friend` refreshes the pending count (focus refresh on the Social tab plus an explicit callback from the route), and the back action returns to the Social tab
- [ ] Add the `/social/requests` route (`app/social/requests.tsx`) listing **recibidas** and **enviadas** with accept, reject and cancel, reusing `FriendRequestSection` and the existing `useFriendActions` operations
- [ ] The requests screen counts and renders only `pending` requests and shows an empty state when there are none
- [ ] Remove the search form, the request sections and the shared-expenses section from the Social tab
- [ ] Do not change `FriendRow` behaviour: removal stays in the row until TICKET-042 moves it to the friend detail, and the row does not navigate yet
- [ ] Cover loading, error with retry, empty and pull-to-refresh on every screen, and refresh friends/requests when the screen regains focus
- [ ] Add accessibility roles, labels and hints for the segmented control (`tablist`/`tab` plus selected state), the pending row and its badge, the FAB, every menu action and the back action
- [ ] Keep every visible string, including accessibility copy, in the `social` or `navigation` namespaces with es/en parity; no string is inline and `npm run check:copy` passes
- [ ] Add the pending-count logic as a pure helper (for example `features/social/utils/pending-requests.ts`) with colocated tests, and do not duplicate search or request logic in the new screens
- [ ] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [ ] The **Social** tab shows the pending-requests row, the segmented control and the friends list in the **Tus amigos** segment
- [ ] The **Tus grupos** segment shows a coming-soon empty state and renders no group action
- [ ] The pending row count equals the received plus sent `pending` requests, and the badge is hidden when that count is 0
- [ ] `/social/add-friend` searches by email and sends a request, and the Social tab reflects the new outgoing request on return
- [ ] `/social/requests` accepts, rejects and cancels requests, and the pending count on the Social tab follows
- [ ] The social surface no longer renders the search form, the request sections or the shared-expenses section
- [ ] **Crear grupo** and **Unirse a grupo** are not rendered anywhere in the Social FAB menu
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

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
