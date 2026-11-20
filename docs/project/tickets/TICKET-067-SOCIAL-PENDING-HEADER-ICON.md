# TICKET-067 - Social Pending Requests Header Icon with Badge

**Type:** UX  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** TICKET-041, TICKET-047  
**Sprint:** Post-MVP / Phase 6.0

## Description
The Social tab devotes a full-width banner in the scroll content to pending friend requests, even when there are none. Move that entry point to the top-right corner of the screen header as a button with only the icon, and show a highlighted badge on the icon when there is at least one pending request, matching the dashboard notifications bell.

## Requirements
- [ ] Turn `features/social/components/social-header.tsx` into a row: title and subtitle on the left, the pending-requests icon button on the right
- [ ] Use the same icon the banner shows today (`mail-unread-outline`) and keep the button always visible, including while loading and after an error, with a zero badge in those states
- [ ] Show the badge only when the count is greater than zero, cap it at `99+` and give it the highlighted notification look
- [ ] Keep the same visual language as `features/notifications/components/notifications-bell.tsx` and converge their palettes instead of keeping two different badge colors
- [ ] Extract a shared `shared/components/molecules/icon-badge-button.tsx` (icon name, count, translated accessibility label/hint, `onPress`) and reuse it in `NotificationsBell` and in the Social header, so the badge is written once
- [ ] Keep the button opening `/social/requests` and the pending count coming from `useSocialScreen` + `utils/pending-requests.ts`; no new query
- [ ] Delete `features/social/components/social-pending-row.tsx`, its usage in `social-screen.tsx` and the now-unused styles (`pendingRow`, `pendingBody`, `pendingCount`, `badge`, `badgeText`)
- [ ] Clean `features/social/locales/{es,en}.json` `pending.*`: keep the accessibility label and hint, drop `title`, `count` and `empty` if nothing else uses them, and add the button label/hint needed by the icon
- [ ] Keep the screen-reader summary: the label announces the pending count and the hint explains where the button goes
- [ ] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [ ] The Social tab has no pending-requests banner inside the list
- [ ] A top-right icon button replaces it and opens the pending requests screen
- [ ] The badge appears only with one or more pending requests and shows the real count, capped at `99+`
- [ ] The icon stays reachable while the friends list is loading or has failed
- [ ] The dashboard bell and the Social icon share one badge implementation and one highlighted color
- [ ] Screen readers announce the count on the button, not on a decorative badge
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Technical Notes
- Current layout: `social-screen.tsx` renders `SocialHeader` and then, inside the ScrollView, `SocialPendingRow` with `count` and an `onPress` that pushes `/social/requests`. The count already comes from `useSocialScreen` (`pendingCount` = incoming + outgoing `pending` requests), so removing the row does not change any data path.
- The badge palette differs today: `social-pending-row.tsx` uses `theme.primary` on `theme.onPrimary` with no cap, while `notifications-bell.tsx` uses `theme.danger` and caps at `99+`. Pick one highlighted token (`theme.danger` reads as an alert on both screens) and document it in the extracted component; both screens must render identically.
- `icon-badge-button.tsx` receives the icon name as a typed `Ionicons` name, the count, already-translated label/hint and `onPress`; it owns the hit slop, the pressed feedback, the `accessibilityRole="button"` and the decorative-badge hiding (`accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"`), mirroring the bell.
- The Social header lives inside the safe-area padding already applied by `SocialScreen` (`insets.top + 16`), so the button only needs its own hit slop and must not add a second safe-area inset.
- Header sizing: the title/subtitle block takes `flex: 1` and the button stays at the end; keep the subtitle wrapping below the title and the button aligned with the title line.
- The empty state stays untouched: `SocialFriendsSegment` keeps its own empty card, and the requests screen keeps its own empty state.
- No rules, schema or index change; `social/requests` is an existing route already in `PRIVATE_SEGMENTS`.
- Out of scope: the notification bell behavior (TICKET-047), unread state for requests, push notifications (TICKET-052) and any redesign of the friends/groups segments.

## Validation Plan
- Open the Social tab with zero pending requests: no banner, icon visible without a badge.
- Receive a friend request with the app open: the badge appears with the right count and the icon still opens `/social/requests`.
- Accept or reject the last request: the badge disappears on return.
- Force a friends load error and a loading state: the icon stays visible and the requests screen still opens.
- Verify the badge count against incoming plus outgoing pending requests and the `99+` cap.
- Compare the Social icon and the dashboard bell side by side in light and dark mode.
- Check Spanish/English and the screen reader: one announcement with the count, no double reading of the badge.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-041 Social shell and pending requests (delivered; the banner and the requests screen)
- TICKET-047 notification inbox and bell (delivered; badge and inbox conventions)
