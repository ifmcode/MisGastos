# [DONE] TICKET-058 - Notification Back Navigation and Creditor Wallet Follow-Up

**Type:** Fix  
**Priority:** Medium  
**Status:** ✅ Done (18/11/2026)  
**Related:** TICKET-046, TICKET-047  
**Sprint:** Post-MVP / Phase 5.2

## Description
Two follow-ups reported after TICKET-047 shipped. First, the navigation contract is replaced: TICKET-047 made back from every notification target land on the friend detail, and the user prefers returning to the screen where they were, so back now returns to the originating screen (the inbox for a row, whatever screen the banner interrupted) and the friend detail stays only as the no-history fallback. Second, the creditor's optional income-wallet follow-up was buried inside the settlement detail, below the summary, so it was not obvious when the notification opened; it is now the first block of the detail, while the debtor loses the income-wallet rows that made them believe a wallet had to be chosen. This ticket supersedes TICKET-047's "back always lands on the friend detail" rule and the matching decision in `session-notes/2026-11-17-account-portability-and-notifications.md`.

## Requirements
- [x] Back from a notification target returns to the screen it was opened from — the inbox for a row, the previous screen for a banner — instead of always landing on the friend detail
- [x] `buildNotificationTargetHref` stops appending `from=notification` and keeps `friendUid` only as the fallback parent used when a detail is opened without history (deep link or future push); the settlement and shared-expense routes still read `friendUid` for that fallback
- [x] `shared/hooks/use-detail-close-navigation.ts` pops when there is history and otherwise replaces with the friend detail, or with the Social hub when the target carries no friend
- [x] The creditor's optional income-wallet follow-up is the first block of the settlement detail, above the summary, with the title «Recibir el dinero» / "Receive the money", the optional hint «Opcional: elige la cartera donde quieres ingresar esta liquidación.» / "Optional: choose the wallet where you want to deposit this settlement.", the existing **Elegir cartera** button and the unchanged linked, archived and unlink states
- [x] The settlement detail omits the `Cartera de ingreso` and `Ingreso en Movimientos` rows for the debtor, who keeps only the direction and the subtitle («Pagaste …»)
- [x] The shared `DetailView`/`DetailBody` gains a `highlightContent` slot rendered above the summary, distinct from `errorContent`
- [x] Spanish/English copy for the new title and hint, with no hardcoded string in the components
- [x] Tests for the settlement detail builder covering the creditor/debtor subtitle, the cents conversion and the creditor-only fields
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [x] Opening a settlement notification as the creditor shows «Recibir el dinero» and **Elegir cartera** without scrolling, and linking a wallet creates the income movement in **Movimientos**
- [x] As the debtor the settlement detail shows no wallet block and no `Cartera de ingreso` / `Ingreso en Movimientos` row, and the subtitle says «Pagaste …»
- [x] Back from a target opened from the inbox returns to the inbox, and back from a banner returns to the previous screen
- [x] A deep link without history still lands on the friend detail, or on the Social hub when there is no friend
- [x] The new copy is available in Spanish and English and the detail reads correctly in light and dark mode
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Implemented

### Back navigation
`buildNotificationTargetHref` (`features/notifications/utils/notification-targets.ts`) no longer appends `from=notification`: a settlement or shared-expense target carries `friendUid` only, and that param is the fallback parent for a detail opened without history. `shared/hooks/use-detail-close-navigation.ts` now calls `router.back()` when `router.canGoBack()` and otherwise replaces the target with `/social/friends/[friendUid]`, or with `/(tabs)/social` when there is no friend. The settlement and shared-expense routes keep reading `friendUid` for that fallback. The stack is therefore whatever the user actually had — inbox, dashboard, friend detail — plus the detail, and a banner returns to the screen it interrupted.

### Creditor follow-up
`SettlementDetailWallet` (`features/settlements/components/settlement-detail-wallet.tsx`) is now passed through the new `highlightContent` slot of `DetailView`, so it renders above the summary instead of inside the field list. It keeps the unchanged states: no wallet → `detail.receiveTitle` + `detail.receiveHint` + **Elegir cartera**; linked wallet → the name (or `detail.walletUnavailable`) with **Quitar cartera**; archived wallet → the archived notice and the unlink action. It returns `null` for the debtor and for an inactive settlement.

### Debtor visibility
The `Cartera de ingreso` and `Ingreso en Movimientos` fields are creditor-only in `getSettlementDetailFields` (`features/settlements/utils/settlement-detail-view.ts`), gated by the existing `isCreditor` helper, so the debtor only sees the direction and the «Pagaste …» subtitle. This removes the reported confusion of a debtor reading `Cartera de ingreso: Cartera no disponible` and assuming a wallet had to be chosen.

### Shared component
`shared/components/organisms/detail-view.tsx` and `detail-body.tsx` accept an optional `highlightContent` slot rendered above the summary card, separate from `errorContent`. Every existing consumer is unchanged because the slot is optional.

### Tests
New `features/settlements/utils/__tests__/settlement-detail-view.test.ts` covers the creditor and debtor subtitle, the cents → amount conversion and the creditor-only fields.

### Verification
- `npx tsc --noEmit`: OK
- `npx expo lint`: OK
- `npx jest`: 253 suites / 1475 tests
- `npm run test:coverage`: 98.93 % statements, 94.50 % branches, 98.59 % functions, 99.38 % lines
- `npm run check:copy`: 250 TSX files

Pending manual item: the device check of the creditor flow (open the notification, choose the wallet, unlink).

### Session note
`docs/project/development-notes/session-notes/2026-11-18-notification-inbox.md` (§10, addendum of 18/11/2026).

## Technical Notes
- **Where the back rule lives:** the decision is split between the href helper (`buildNotificationTargetHref` decides which params exist) and `useDetailCloseNavigation` (pops, or replaces with the fallback). Nothing else builds a notification target, and the settlement/shared-expense routes only read `friendUid` for the no-history case, so the two entry points (row and banner) cannot drift.
- **Why the follow-up moved:** the creditor's income wallet is the only action a settlement notification expects, so it has to be visible the moment the detail opens. `highlightContent` is a layout slot of the shared detail, not a settlement-specific branch, and `errorContent` still owns mutation errors.
- **Creditor gating:** `isCreditor` compares `toUserId` with the viewer, so the field list and the wallet block share one rule instead of two conditions that could disagree.
- **Amount formatting:** `formatAmount` in `settlement-detail-view.ts` now converts with `centsToAmount` before `formatCurrency`; the stored record stays in integer cents.
- **Zero-wallet accounts:** a creditor with no wallet still creates one manually from **Carteras**; nothing re-seeds a wallet, which matches the TICKET-057 decision that zero wallets is a valid state.
- **No data change:** no collection, document shape, rule or index changed, so no migration and no rules deployment is needed for this ticket.

## Validation Plan
- Two accounts: the debtor creates a settlement, the creditor opens the notification and confirms «Recibir el dinero» and **Elegir cartera** are visible without scrolling.
- Link a wallet, confirm the income movement appears in **Movimientos**, then unlink it and confirm the income is reverted and the block returns to the **Elegir cartera** state.
- As the debtor, open the same settlement and confirm there is no wallet block, no `Cartera de ingreso` / `Ingreso en Movimientos` row and that the subtitle says «Pagaste …».
- Open a target from the inbox, press back and confirm it returns to `/notifications`; open one from the foreground banner and confirm back returns to the interrupted screen.
- Open a target as a deep link with no history and confirm it lands on the friend detail, or on the Social hub without a friend.
- Repeat the visual check in light/dark mode and in Spanish/English, including the screen-reader labels of **Elegir cartera** and **Quitar cartera**.

## Dependencies
- TICKET-046 settlement flow and the creditor's optional income wallet
- TICKET-047 inbox, banner and notification targets
- TICKET-057 only for the zero-wallet path: an account without wallets still creates one manually, no re-seed
