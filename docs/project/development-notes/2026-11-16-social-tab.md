# Session note - Social tab shell (TICKET-041)

**Date:** 16/11/2026  
**Ticket:** TICKET-041 (done)  
**Status:** ✅ Done (ticket file renamed with the `[DONE] ` prefix)

## Context
The **Amigos** tab had grown into three different jobs at once: email discovery,
incoming/outgoing request management and the 1:1 shared-expenses section. That
left no room for groups (Phase 6), hid pending requests below the fold and made
the tab header compete with two unrelated actions. TICKET-041 turns the tab into
a small **Social** hub and moves the two heavy flows into their own routes.

## Decision
- `app/(tabs)/social.tsx` renders `SocialScreen` from the new `features/social`;
  `app/(tabs)/friends.tsx` is deleted. The tab keeps `tabs.social`, the
  `person.2.fill` icon and its position.
- The hub is header + pending row + **Tus amigos** / **Tus grupos** segments +
  friends list + FAB. The search form, the request sections and the
  shared-expenses section are no longer rendered there.
- Two sibling routes: `/social/add-friend` (`app/social/add-friend.tsx`) and
  `/social/requests` (`app/social/requests.tsx`). Both are declared in
  `auth-navigator.tsx` with `headerShown: false`, and `social` joined
  `PRIVATE_SEGMENTS` so the unverified-email guard follows them.
- The pending row is always rendered; the badge only appears when the count is
  greater than 0 and the row opens `/social/requests`.
- The FAB opens the new shared `FabActionMenu` with exactly one action,
  **Añadir amigo**. **Crear grupo** and **Unirse a grupo** are intentionally
  absent until Phase 6.
- **Feature split:** `features/social` owns the shell, segment state, pending row
  and route composition; `features/friends` keeps the domain (types, schemas,
  service, repositories, balance utils). No service, schema or repository was
  duplicated: the routes reuse `useFriendSearch`, `FriendSearchForm`,
  `FriendSearchResult`, `FriendSearchEmpty`, `FriendRequestSection` and
  `useFriendActions`.

## Alternatives rejected
- **`ActionSheetIOS`** for the FAB menu: native only, and the project targets
  Android and web as well.
- **A one-off overlay in each screen:** duplicated theme, safe-area and
  accessibility work, and TICKET-045 needs the same menu in the movements FAB.
- **Duplicating the search or request logic inside the new screens:** the
  existing hooks and components already cover loading, errors and accessibility.

## Consequences
- **Accepted gap:** after removing the shared-expenses section there is no entry
  point to create a 1:1 expense until TICKET-042 mounts it in the friend detail.
  Ship TICKET-041 and TICKET-042 together, or state the gap explicitly in any
  demo.
- **Groups placeholder:** **Tus grupos** shows a coming-soon `EmptyState` with no
  action, so TICKET-008 has a place to land without a second navigation rewrite.
- **Shared menu API:** `FabActionMenu` is the stable contract for TICKET-045
  (`visible`, `title`, `onClose`, `actions[{ key, label, icon, hint?, disabled?,
  onPress }]`). Every string arrives already translated, so the menu knows nothing
  about friends, groups or movements.
- **Dead code removed:** `features/friends/components/friends-screen.tsx`,
  `friends-header.tsx`, `features/friends/hooks/use-friends-screen.ts`, the unused
  `friends` root copy keys (`title`, `subtitle`, `loading`, `errorTitle`,
  `retryAccessibility`) and the unused `friendsStyles.container`/`scrollContent`.

## Pending count and refresh
`features/social/utils/pending-requests.ts` exports `getPendingRequests` (keeps
order, drops every non-`pending` status, returns `{ incoming, outgoing, total }`)
and `countPendingRequests`. The row badge and the `/social/requests` list read the
same number, so they cannot drift; both are covered by colocated tests.

Refresh has two sources on purpose: `useFriendsOverview` refreshes on focus, and
`features/social/utils/requests-refresh-store.ts` provides an explicit
subscribe/notify callback that `/social/add-friend` fires through
`notifyRequestsRefresh` after a successful send (`onRequestSent` in the route).
A failed background refresh keeps the existing data and shows an `ErrorBanner`;
the full-screen `ErrorState` only appears when there is no data to show.

## Accessibility contract
- Segment control: `tablist` container with `tab` children and the selected state.
- Pending row: button role, a label that includes the count, and a badge that is
  hidden from screen readers when it is not rendered.
- FAB and route back actions: translated label plus hint.
- `FabActionMenu`: modal card marked as an accessibility modal with
  `onAccessibilityEscape`, one button row per action, `accessibilityHint` from the
  action and `accessibilityState.disabled` when disabled.
- `FriendRow` is unchanged: removal stays in the row and the row does not
  navigate yet (TICKET-042).

## Verification
`npx tsc --noEmit`, `npx expo lint`, `npx jest` (194 suites / 1004 tests),
`npm run check:copy` (204 TSX files) and `npm run test:coverage` (99.00 %
statements, 94.70 % branches, 99.01 % functions, 99.49 % lines;
`features/social/utils` at 100 %) all pass. Reviewer verdict: `approve with nits`,
no blockers; the code nits were fixed before this note.

## Open items
- **Manual emulator validation is pending:** the Social hub, segment switch,
  pending row with 0/1/several requests, both routes, light/dark and es/en, two
  accounts for the cross-device pending count, and the iOS modal
  close-then-navigate behaviour were not exercised in this session (no device).
- The auth guard for unverified email/password accounts must be re-checked
  manually on `/social/add-friend` and `/social/requests`.
- TICKET-042 owns the friend detail, its shared-expense list, the remove action
  moved out of the row and the restored 1:1 expense entry point.
