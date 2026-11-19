# [DONE] TICKET-059 - Unified Friend Timeline of Shared Expenses and Settlements

**Type:** UX  
**Priority:** High  
**Status:** ✅ Done (19/11/2026)  
**Related:** TICKET-042, TICKET-043, TICKET-046, TICKET-047, TICKET-055, TICKET-058  
**Sprint:** Post-MVP / Phase 5.1

## Description
The friend detail used to render the pair history as two separate surfaces: a highlighted card for the latest settlement and a "Gastos compartidos" card list for expenses. The reference `docs/project/ui-references/friend screen reference.jpg`, from the **Liquidar deudas** button downwards, shows a single movement register where settlements and shared expenses are interleaved by date. This ticket replaces both surfaces with one timeline: flat rows with a date gutter (month abbreviation above the day), an icon, a title, a meta line and, for expenses, the viewer's economic effect on the right (`prestaste` / `pediste`). Every row opens its detail. The header (identity, per-currency balances, remove action and **Liquidar deudas**) is unchanged, and the scanner and add-expense buttons from the mockup are out of scope.

Four decisions are closed with the user:

1. **Full mockup row:** date gutter, icon tile, title, meta and the right-side effect for expenses; settlement rows show the payment sentence.
2. **Keep the full-settlement collapse:** when the pair is at zero and an active settlement exists, the existing notice hides the whole timeline (expenses and settlements) until **Ver gastos anteriores** is pressed.
3. **Keep the section title** `Gastos compartidos` above the timeline.
4. **Replace the latest-settlement card with a timeline row**, so the same settlement is never shown twice.

## Requirements
### Timeline data
- [x] Add a pure `buildFriendTimeline({ expenses, settlements })` in `features/social/utils/friend-timeline.ts` that returns a discriminated union (`kind: "expense" | "settlement"`) carrying a stable `key`, `date` and `createdAt`
- [x] Interleave active pair expenses (`getFriendExpenses`) with active pair settlements (`getPairSettlements` + `filterActiveSettlements`); soft-deleted records never appear
- [x] Sort newest first by the spending/transfer `date`, then `createdAt`, then `key`, so equal dates stay deterministic
- [x] Add a pure `getExpenseTimelineEffect(expense, viewerUid)` that derives the viewer's pair effect from `buildExpenseLedgerEntries` (viewer is creditor → `lent`, debtor → `borrowed`, zero share or unknown uid → `null`), using integer cents and never converting currency
- [x] Compose the timeline in `useFriendDetailScreen` from the already-loaded lists: no new query, composite index or Firestore rule change

### Row presentation
- [x] Add a `FriendTimelineRow` presentational shell plus its own style module with the mockup layout: date gutter (month abbreviation above the day), icon tile, title, optional meta and optional right-side amount; no card border, pressed opacity and no chevron
- [x] Expense row: title = description; meta = `Pagaste tú` / `Pagó {{name}}` plus the total; right side = `prestaste {{amount}}` in the success tone or `pediste {{amount}}` in the danger tone when the viewer has an effect, hidden when there is none
- [x] Settlement row: title = `Pagaste {{amount}} a {{name}}` / `{{name}} te pagó {{amount}}`; meta = the note when present; a distinct icon and tone; no right-side amount
- [x] Every row is a pressable button with role, label (title + meta + amount), hint and pressed state; expense rows open `/social/expenses/[expenseId]` and settlement rows open `/social/settlements/[settlementId]`
- [x] Replace `FriendDetailExpenses` and the `SettlementMessage` card with a `FriendDetailTimeline` that keeps the loading state, the inline error with retry, the empty state (`social:friendDetail.empty*`) and the full-settlement collapse with the existing `settlements:expenses.*` copy
- [x] Keep the `sharedExpenses:title` section title above the timeline
- [x] Delete the now-dead `FriendSharedExpensesList`, `SharedExpenseRow` and `SettlementMessage`, with their unused styles and copy, instead of leaving parallel alternatives

### Copy and accessibility
- [x] Add es/en copy in the `sharedExpenses` namespace for the effect labels plus any new accessibility label or hint; reuse `row.youPaid`, `row.friendPaid` and `settlements:message.youPaid`/`youReceived`/`openHint` instead of duplicating sentences
- [x] Keep every visible string, label and hint in a translation namespace; no hardcoded colour inside components
- [x] The date gutter reads as one accessible date in the row label; the month and day must not be announced as two unlabeled fragments
- [x] Keep the period-stripping of the short month (`nov.` → `nov`) so Spanish and English match the mockup

### Verification
- [x] Colocated tests for `buildFriendTimeline` (interleaving, ordering with equal dates, active/soft-deleted filtering, empty lists, stable keys) and for `getExpenseTimelineEffect` (viewer creditor, viewer debtor, zero share, unknown uid)
- [x] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [x] The friend detail shows one timeline below the settle button where shared expenses and settlements are interleaved newest first
- [x] Each row is clickable and opens the correct detail (shared expense or settlement), and back returns to the friend detail
- [x] An expense row reads date, description, who paid and the total, and shows `prestaste` or `pediste` with the correct amount; a settlement row reads the payment sentence
- [x] Soft-deleted expenses and settlements never appear, and the latest settlement appears once, as a row
- [x] When the pair is fully settled and an active settlement exists, the notice hides the whole timeline and **Ver gastos anteriores** reveals it again
- [x] The empty state still shows when the pair has no entries
- [x] Copy exists in Spanish and English, the rows are readable in light/dark mode and with a screen reader, and no row exposes raw colours or sentences
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Implemented

Implemented and verified on 19/11/2026. Decision record:
`docs/project/development-notes/session-notes/2026-11-19-friend-unified-timeline.md`.

### Timeline data
- `features/social/utils/friend-timeline.ts` adds `FriendTimelineEntry` (`kind: "expense" | "settlement"`, `key`, `date`, `createdAt` and the source record) and `buildFriendTimeline`, which defensively filters soft-deleted expenses and settlements and sorts by `date` descending, `createdAt` descending and `key` ascending with `localeCompare`.
- `getExpenseTimelineEffect` reuses `buildExpenseLedgerEntries`: the viewer as `toUserId` means `lent`, as `fromUserId` means `borrowed`, and a zero share or an unknown/empty uid returns `null`. Amounts stay in integer cents and the currency is never converted.
- `useFriendDetailScreen` composes the timeline from the already-loaded pair lists (`getFriendExpenses` + `getPairSettlements`), so there is no new query, composite index, rule or service change.
- Tests: `features/social/utils/__tests__/friend-timeline.test.ts`, 10 cases (empty lists, interleaving, equal-date ordering by `createdAt`, key fallback, soft-deleted filtering, stable keys, viewer creditor, viewer debtor, zero share and unknown/empty viewer).

### Rows
- New `FriendTimelineRow`: date gutter with the short month (trailing period stripped) above the day, a 40×40 icon tile, title, optional meta and optional right amount, with no card border and no chevron, plus pressed opacity.
- `FriendTimelineExpenseRow`: title is the description; meta joins `Pagaste tú` / `Pagó {name}` with the total; the right side shows `Prestaste {amount}` in the success tone or `Pediste {amount}` in the danger tone and is hidden without an effect; icon `receipt-outline`.
- `FriendTimelineSettlementRow`: the payment sentence as the title, the note as meta, `cash-outline` on the new success surface and no right amount.
- `FriendTimelineList` renders each entry by kind; `FriendDetailTimeline` owns the section title, the loading state, the inline error with retry plus banner, the empty state and the collapsed full-settlement notice.
- `features/social/styles/friend-timeline.styles.ts` holds layout only; every colour comes from `useFormTheme`.

### Composition
- `useFriendDetailScreen` exposes `timeline`, `timelineLoading`, `timelineError` and `reloadTimeline`; `useFriendDetailSettlements` returns `canCollapseTimeline`, `showTimeline` and `toggleTimeline` and resets the expanded flag when a new debt makes the timeline collapsible again, so the next full settlement starts collapsed.
- The screen navigates settlement rows to `/social/settlements/[id]` and keeps `/social/expenses/[id]` for expenses; the rows only call `onOpen`, so no navigation lives inside a child row.

### Accessibility
- Expense label: full date + description + payer/total + effect; settlement label: full date + payment sentence + note.
- The date gutter is hidden from assistive technology (`accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`).
- Hints are `sharedExpenses:row.openHint` and `settlements:message.openHint`.

### Copy
- Added `sharedExpenses:row.youLent` / `row.youBorrowed` in es/en and removed the dead `sharedExpenses:row.yourShare`, `row.yourSharePercent`, `row.openAccessibility` and `settlements:message.title`/`full`/`partial`/`openAccessibility`.
- Kept `row.youPaid`, `row.friendPaid`, `sharedExpenses:title`, `social:friendDetail.empty*`, `settlements:message.youPaid`/`youReceived`/`openHint` and the collapse copy (`settlements:expenses.*`).

### Shared token
- Added `successSurface` to `ThemeTokens`, the light and dark token maps and `FormTheme`, so the settlement tile has a distinct tone instead of reusing a danger or warning surface.

### Dead code
- Deleted `friend-detail-expenses.tsx`, `friend-shared-expenses-list.tsx`, `shared-expense-row.tsx` and `settlement-message.tsx`, with their unused styles and copy, instead of leaving parallel alternatives.

### Verification (19/11/2026)
- `npx tsc --noEmit` clean.
- `npx expo lint` clean.
- `npx jest`: 256 suites / 1517 tests passed.
- `npm run test:coverage`: gate passed (All files 98.92% statements, 94.54% branches, 98.61% functions, 99.36% lines).
- `npm run check:copy` passed (253 TSX files).
- No Firestore rules, index or service change.

### Known limitations and manual steps
- Manual device/simulator QA is pending: light/dark, VoiceOver/TalkBack, pull-to-refresh, soft-deleted records, the full-settlement collapse and back navigation from both details.

### Files
- New: `features/social/utils/friend-timeline.ts`, `features/social/utils/__tests__/friend-timeline.test.ts`, `features/social/components/friend-timeline-row.tsx`, `friend-timeline-expense-row.tsx`, `friend-timeline-settlement-row.tsx`, `friend-timeline-list.tsx`, `friend-detail-timeline.tsx`, `features/social/styles/friend-timeline.styles.ts`, `features/social/types/friend-detail-screen.types.ts`.
- Modified: `features/social/hooks/use-friend-detail-screen.ts`, `use-friend-detail-settlements.ts`, `features/social/components/friend-detail-screen.tsx`, `features/social/styles/friend-detail.styles.ts`, `shared/types/theme.types.ts`, `shared/constants/theme-tokens.ts`, `shared/hooks/use-form-theme.ts`, `features/shared-expenses/locales/{es,en}.json`, `features/settlements/locales/{es,en}.json`.
- Deleted: `friend-detail-expenses.tsx`, `friend-shared-expenses-list.tsx`, `shared-expense-row.tsx`, `settlement-message.tsx`.

## Technical Notes
- **Why `features/social`:** the timeline composes two features (`shared-expenses` and `settlements`) for the friend detail, so the join lives in `features/social/utils` and neither ledger feature depends on the other. Groups (Phase 6) can reuse the builder with group participants later.
- **No new query:** `useSharedExpenseList` and `useSettlementsList` already load viewer-scoped lists; the pair filter stays in memory (`getFriendExpenses` / `getPairSettlements`), so no index and no rules change.
- **Effect from the ledger, not a second formula:** `buildExpenseLedgerEntries` is the existing source of truth for `from owes to`. An expense where the viewer is `toUserId` means the viewer lent; where the viewer is `fromUserId` means the viewer borrowed. Reusing it keeps the row aligned with the balances for equal, percentage, fixed and shares splits.
- **Collapse stays as TICKET-046:** `isPairFullySettled` plus `activeCount > 0`; the only change is that it now gates the unified timeline instead of just the expense list.
- **Date gutter:** format with `useAppLocale().formatDate` using `{ month: "short" }` and `{ day: "numeric" }` and strip the trailing period, so es/en follow `Intl` without a new date helper; the full date stays in the row accessibility label.
- **Dead code:** `FriendSharedExpensesList` and `SharedExpenseRow` lose their only consumer and `SettlementMessage` loses its only consumer. Delete them with their styles and unused copy (`sharedExpenses:row.yourShare*`, `settlements:message.title/full/partial`) instead of keeping a parallel row style.
- **Out of scope:** the scanner and add-expense FABs from the mockup, the group row (`Grupo compartido`), the **Solicitar** / **Recordar** actions, date group headers, pagination, currency conversion and any change to balances, services, repositories or `firestore.rules`.

## Validation Plan
- Open a friend with expenses and at least one settlement and confirm the rows interleave newest first with the correct date gutter, icon, title and effect.
- Tap an expense row and a settlement row and confirm each opens its detail and back returns to the friend detail.
- Confirm a soft-deleted expense and a soft-deleted settlement are absent.
- Settle the whole debt and confirm the notice hides all rows and **Ver gastos anteriores** restores them.
- Check a friend with no entries, the inline error with retry, pull-to-refresh, light/dark, Spanish/English and a screen reader.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-042 friend detail and shared expenses
- TICKET-043 shared expense detail route
- TICKET-046 1:1 settlement and the full-settlement collapse
- TICKET-047 notification targets that open both details
- TICKET-055 shared expense form refinement (row copy unchanged)
