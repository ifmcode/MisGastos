# Social Pending Requests Header Icon with a Shared Badge (TICKET-067, 22/11/2026)

## Context

The Social tab rendered `SocialPendingRow` as the first element of its `ScrollView`: a
full-width card with the `mail-unread-outline` icon, a **Peticiones pendientes** title and
a secondary line, shown even when nothing was pending. Its badge used `theme.primary` with
no cap, while the dashboard `NotificationsBell` already used `theme.danger` and capped the
count at `99+`, so the same idea had two implementations and two palettes.

## Decision

One shared badge, rendered in the header.

- **Shared molecule:** `shared/components/molecules/icon-badge-button.tsx`
  (`IconBadgeButton`) plus `icon-badge-button.styles.ts`. Props: `icon` (typed
  `Ionicons` name), `count`, already translated `accessibilityLabel` and
  `accessibilityHint`, and `onPress`. It owns the 44x44 hit target, the pressed feedback,
  `accessibilityRole="button"`, the `99+` cap, the `theme.danger` fill with
  `theme.onPrimary` text, the icon in `theme.text` (no colour prop) and the decorative
  badge (`accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"`).
- **Highlighted colour:** `theme.danger`. It reads as an alert on both screens and it is
  the colour the bell already used, so the Social icon adopts it instead of keeping
  `theme.primary`.
- **Consumers:** `NotificationsBell` keeps its public props (`count`, `onPress`) and now
  only resolves the `notifications` copy; `SocialHeader` passes `mail-unread-outline`,
  `pendingCount`, `pending.rowAccessibility`/`pending.labelZero` and `pending.hint`.
- **Header:** `SocialHeader` is a row with the title + subtitle block (`flex: 1`) on the
  left and the button on the right, mirroring `dashboard-header.tsx`. It receives
  `pendingCount` and `onOpenRequests`; the screen keeps the navigation and the count
  (`useSocialScreen` → `countPendingRequests` plus the group invitations), so no query
  changed.

## Removed

- `features/social/components/social-pending-row.tsx`, its usage in `social-screen.tsx`
  and the styles `pendingRow`, `pendingBody`, `pendingCount`, `badge` and `badgeText`.
  `header` became a row and gained `headerText`.
- `notifications.styles.ts`: `bell`, `bellBadge` and `bellBadgeText`.
- Social copy `pending.title`, `pending.count_one`/`count_other` and `pending.empty`;
  `pending.labelZero` was added and `rowAccessibility_*` plus `hint` were kept.

## Consequences

- The banner never occupies list space again, and the entry point stays reachable while
  the friends list is loading or after a load error, because the header lives outside the
  `ScrollView`.
- The bell and the Social icon can no longer drift apart: one component, one colour, one
  cap. Any future header counter reuses the same molecule.
- Screen readers hear one announcement on the button with the pending count; the badge is
  hidden from the accessibility tree.
- No route, schema, rules, index or data-path change.
- Carried over from the bell: the badge keeps `theme.danger` with `theme.onPrimary`
  text, which is under WCAG AA for 11px text in dark mode (`#EF5350`). Fixing it needs a
  dedicated badge-text token and was out of scope, because this ticket only converges
  both badges.

## Verification

- `npx tsc --noEmit` clean, `npx expo lint` clean, `npx jest` 332 suites / 2030 tests
  passed, `npm run check:copy` passed (315 TSX files). Coverage was not re-run because no
  test or business logic changed.
- Pending: manual device validation (light/dark, Spanish/English, screen reader and the
  loading/error states).
