# [DONE] TICKET-067 - Social Pending Requests Header Icon with Badge

**Type:** UX  
**Priority:** Medium  
**Status:** ✅ Done (22/11/2026)  
**Related:** TICKET-041, TICKET-047  
**Sprint:** Post-MVP / Phase 6.0

## Description
The Social tab devotes a full-width banner in the scroll content to pending friend requests, even when there are none. Move that entry point to the top-right corner of the screen header as a button with only the icon, and show a highlighted badge on the icon when there is at least one pending request, matching the dashboard notifications bell.

## Requirements
- [x] Turn `features/social/components/social-header.tsx` into a row: title and subtitle on the left, the pending-requests icon button on the right
- [x] Use the same icon the banner shows today (`mail-unread-outline`) and keep the button always visible, including while loading and after an error, with a zero badge in those states
- [x] Show the badge only when the count is greater than zero, cap it at `99+` and give it the highlighted notification look
- [x] Keep the same visual language as `features/notifications/components/notifications-bell.tsx` and converge their palettes instead of keeping two different badge colors
- [x] Extract a shared `shared/components/molecules/icon-badge-button.tsx` (icon name, count, translated accessibility label/hint, `onPress`) and reuse it in `NotificationsBell` and in the Social header, so the badge is written once
- [x] Keep the button opening `/social/requests` and the pending count coming from `useSocialScreen` + `utils/pending-requests.ts`; no new query
- [x] Delete `features/social/components/social-pending-row.tsx`, its usage in `social-screen.tsx` and the now-unused styles (`pendingRow`, `pendingBody`, `pendingCount`, `badge`, `badgeText`)
- [x] Clean `features/social/locales/{es,en}.json` `pending.*`: keep the accessibility label and hint, drop `title`, `count` and `empty` if nothing else uses them, and add the button label/hint needed by the icon
- [x] Keep the screen-reader summary: the label announces the pending count and the hint explains where the button goes
- [x] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [x] The Social tab has no pending-requests banner inside the list
- [x] A top-right icon button replaces it and opens the pending requests screen
- [x] The badge appears only with one or more pending requests and shows the real count, capped at `99+`
- [x] The icon stays reachable while the friends list is loading or has failed
- [x] The dashboard bell and the Social icon share one badge implementation and one highlighted color
- [x] Screen readers announce the count on the button, not on a decorative badge
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Implemented

Delivered and verified on 22/11/2026. Session note:
[`session-notes/2026-11-22-social-pending-header-icon.md`](../development-notes/session-notes/2026-11-22-social-pending-header-icon.md).

### Shared molecule

- New `shared/components/molecules/icon-badge-button.tsx` (`IconBadgeButton`) plus `icon-badge-button.styles.ts`: icon-only 44x44 `Pressable` that owns the pressed feedback, `accessibilityRole="button"`, the count badge capped at `99+`, a `theme.danger` fill with `theme.onPrimary` text and the icon in `theme.text` (no colour prop). The badge is decorative (`accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"`), so the caller's translated label is the only announcement.
- Props: `icon` (typed `Ionicons` name), `count`, already translated `accessibilityLabel` and `accessibilityHint`, and `onPress`. It owns no translation namespace and no colour constant.
- `features/notifications/components/notifications-bell.tsx` delegates to it with unchanged public props (`count`, `onPress`), so the dashboard bell and the Social header render the same badge.

### Social header

- `features/social/components/social-header.tsx` is now a row: the title + subtitle block (`flex: 1`) on the left and the `mail-unread-outline` `IconBadgeButton` on the right, with new typed props `pendingCount` and `onOpenRequests`.
- The label announces the count (`pending.rowAccessibility`) or `pending.labelZero` when zero, and the hint (`pending.hint`) explains that it opens the requests list.
- `social-screen.tsx` renders `SocialHeader` outside the `ScrollView` with `pendingCount` from `useSocialScreen` and pushes `/social/requests`, so the icon stays visible while the friends list loads and after a load error, without adding a second safe-area inset.

### Removed

- `features/social/components/social-pending-row.tsx`, its usage in `social-screen.tsx`, and the unused `pendingRow`, `pendingBody`, `pendingCount`, `badge` and `badgeText` styles; `header` became a row plus the new `headerText`.
- `features/notifications/styles/notifications.styles.ts` lost `bell`, `bellBadge` and `bellBadgeText`.
- Social locales `pending.*`: kept `rowAccessibility_one`/`rowAccessibility_other` and `hint`, added `labelZero`, removed `title`, `count_one`/`count_other` and `empty`.

### Verification (22/11/2026)

- `npx tsc --noEmit` clean, `npx expo lint` clean, `npx jest` **332 suites / 2030 tests passed**, `npm run check:copy` passed (315 TSX files). Coverage was not re-run: no test or business-logic change.
- No route, query, schema, rules or index change; the data path (`countPendingRequests` over the incoming/outgoing pending requests and the group invitations, read by `useSocialScreen`) is untouched.
- **Pending:** manual device validation (light/dark, Spanish/English, screen reader and the loading/error states).

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
