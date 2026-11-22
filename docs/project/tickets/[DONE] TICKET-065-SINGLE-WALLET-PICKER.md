# [DONE] TICKET-065 - Single Wallet Picker Button Without Preselection

**Type:** UX  
**Priority:** Medium  
**Status:** ✅ Done (22/11/2026)  
**Related:** TICKET-029, TICKET-046, TICKET-055, TICKET-056, TICKET-064  
**Sprint:** Post-MVP / Phase 6.0

## Description
Every wallet field renders up to three wallet chips plus a small `+` chip that opens the full picker, and new records start with a wallet already selected. Replace that row with one explicit **Seleccionar cartera** button (the chosen wallet's name once there is a selection) and stop preselecting a wallet in movements, transfers and shared expenses, so the user always chooses consciously and an empty wallet shows the existing validation error.

## Requirements
- [x] Add one wallet control that reads **Seleccionar cartera** when empty and the selected wallet name (plus its archived/currency marker when relevant) once chosen, with a chevron and a 44pt+ touch target
- [x] Replace `features/wallets/components/wallet-chip-selector.tsx` in all five call sites: movement wallet, transfer source, transfer destination, shared-expense wallet while the TICKET-055 toggle is **Yes**, and the settlement's optional wallet
- [x] Keep `features/wallets/components/wallet-picker-dialog.tsx` as the popup, including the empty message, selected row, archived marker and read-only behavior
- [x] Delete `features/wallets/utils/wallet-chips.ts` (`getWalletChips`, `COMPACT_WALLET_LIMIT`) and its tests once no consumer remains
- [x] Remove the wallet default in `features/transactions/utils/transaction-form-defaults.ts` (`getDefaultWallet`): new movements start with an empty `walletId`, keep the profile preferred currency as the provisional currency and take the wallet currency once one is selected
- [x] Remove the preselection in `features/transfers/utils/transfer-form-defaults.ts` (`getDefaultTransferWallets`): both ids start empty, the provisional currency is the profile preferred currency, and the destination stays filtered by and disabled until a source is chosen
- [x] Remove the wallet default applied on type or currency change in `features/transactions/hooks/use-transaction-form.ts`
- [x] Rely on the existing `WALLET_REQUIRED`, `FROM_WALLET_REQUIRED` and `TO_WALLET_REQUIRED` codes, show them on submit and never disable the save button for a missing wallet
- [x] Keep the picker usable with a single available wallet and never auto-select it
- [x] Keep the stored wallets when editing a movement, transfer or shared expense; the settlement keeps its optional **Sin cartera** and archived handling
- [x] Leave the transaction filters and the dashboard wallet filter untouched: they filter a list and are not required fields
- [x] Add the button and selected-state copy to `features/wallets/locales/{es,en}.json`, keep `picker.selectAccessibility` = **Seleccionar cartera**, and run `npm run check:copy`
- [x] Update the defaults and selector tests, delete the chip-util tests, and run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [x] Every wallet field shows a single **Seleccionar cartera** button instead of a chip list
- [x] No new movement, transfer or shared expense starts with a wallet selected
- [x] Saving without a wallet is blocked with the translated field error, and the error disappears once a wallet is chosen
- [x] The button shows the chosen wallet and reopening the popup changes it
- [x] A transfer cannot choose a destination before a source, and the destination only lists the source currency
- [x] Editing keeps the stored wallets; the settlement still accepts **Sin cartera**
- [x] The picker opens with one wallet and requires an explicit tap
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Implemented

Delivered and verified on 22/11/2026. Session note:
[`session-notes/2026-11-22-single-wallet-picker.md`](../development-notes/session-notes/2026-11-22-single-wallet-picker.md).

### Single trigger

- New `features/wallets/components/wallet-select-button.tsx` (`WalletSelectButton`): props `wallet: Wallet | null`, `disabled`, `hasError`, `accessibilityPrefix` and `onPress`. Empty renders the translated **Seleccionar cartera** (`picker.select`); with a wallet it renders the wallet icon, its name, its currency and the archived badge (`wallets:archivedBadge`). It always shows a chevron, keeps a 44pt+ touch target, uses the danger border when the field has an error, and provides pressed and disabled feedback. It only opens the popup: selection and preselection belong to the caller.
- The component reads the `wallets` namespace directly (`picker.select`, `picker.selectAccessibility`, `picker.selectedAccessibility`, `picker.selectHint`, `archivedBadge`) and receives the screen-reader prefix from the feature wrapper, so each field keeps its own context.

### Popup

- `features/wallets/components/wallet-picker-dialog.tsx` keeps the empty message, the selected row, the archived marker and the read-only behavior, and gained an optional `noneOption` prop rendered as the first row through the new `features/wallets/components/wallet-picker-none-option.tsx` (`WalletPickerNoneOption`, `WalletPickerNoneOptionRow`). It is selected when the field is empty and reports `onSelect("")`.
- The settlement wallet field uses that row for **Sin cartera**; the other four fields do not pass it.

### Call sites

- Migrated all five fields to `WalletSelectButton`: `features/transactions/components/transaction-form-wallet-selector.tsx`, `features/transfers/components/transfer-form-source-selector.tsx`, `features/transfers/components/transfer-form-destination-selector.tsx`, `features/shared-expenses/components/shared-expense-wallet-field.tsx` (only while the TICKET-055 toggle is **Yes**) and `features/settlements/components/settlement-form-wallet-selector.tsx`.
- Deleted `features/wallets/components/wallet-chip-selector.tsx`, `features/wallets/utils/wallet-chips.ts` (`getWalletChips`, `COMPACT_WALLET_LIMIT`) and `features/wallets/utils/__tests__/wallet-chips.test.ts`. The transaction and dashboard filters keep their own chip rendering.

### Defaults and validation

- `buildTransactionFormValues` and `buildTransferFormValues` no longer preselect a wallet and dropped the now-unused `wallets` parameter. New records start with an empty `walletId` / empty `fromWalletId` + `toWalletId` and the profile preferred currency as provisional currency; the selected wallet currency wins afterwards. Edits keep the stored values.
- Save is never disabled for a missing wallet in movements or transfers: submit runs the existing `WALLET_REQUIRED`, `FROM_WALLET_REQUIRED` and `TO_WALLET_REQUIRED` validation and the copy comes from the translation namespaces. The `canSubmit` plumbing was removed from both forms.
- **Approved decision:** the transfer destination is cleared when the source changes and stays disabled until a source exists; the transfer `form.noDestinations` notice only shows once a source is selected.
- **Approved decision:** the settlement's **Sin cartera** is now the first row inside the picker popup instead of a chip next to the trigger.
- The requirement about removing the wallet default applied on type or currency change in `features/transactions/hooks/use-transaction-form.ts` had no counterpart in the current hook (it only syncs the currency from the chosen wallet), so nothing was removed there.

### Copy

- `features/wallets/locales/{es,en}.json`: added `picker.select` and `picker.selectedAccessibility`, updated `picker.selectHint`; `picker.selectAccessibility` stays **Seleccionar cartera**. Removed the unused `settlements.form.walletChipAccessibility` and `sharedExpenses.form.walletGroupAccessibility`.

### Verification

- `npx tsc --noEmit` clean, `npx expo lint` clean, `npx jest` 331 suites / 2026 tests passed, coverage 98.92 % statements / 94.74 % branches / 98.49 % functions / 99.5 % lines, `npm run check:copy` passed (310 TSX files).
- No schema, document, service, repository, money-helper, rules or route change; nothing to deploy.
- **Pending:** manual device validation (light/dark, screen reader and the real forms).

## Technical Notes
- The five field wrappers (`transaction-form-wallet-selector.tsx`, `transfer-form-source-selector.tsx`, `transfer-form-destination-selector.tsx`, `shared-expense-wallet-field.tsx`, `settlement-form-wallet-selector.tsx`) already own the popup state; only the trigger changes, so `WalletPickerDialog` and its option rows stay as they are.
- Suggested component: `features/wallets/components/wallet-select-button.tsx`, receiving the selected wallet or `null`, the translated label, an optional accessibility prefix and `onPress`. It renders the icon, the label/name, a chevron and the error border, and never imports a translation namespace (the caller passes copy), matching the shared-component rule.
- Transaction currency: `use-transaction-form.ts` already derives the currency from the selected wallet; the provisional currency is only used until a wallet exists, so the payload currency never comes from an empty wallet.
- Transfer currency: `getAvailableDestinations` filters by the source currency, so an empty source must disable the destination trigger and its popup; the provisional currency is not sent while `fromWalletId` is empty because `FROM_WALLET_REQUIRED` blocks the save.
- The shared-expense wallet only exists when the viewer pays and the registration toggle is **Yes** (TICKET-055); with **No** the field is not rendered at all. The toggle state stays derived from the stored wallet/category/movement.
- The settlement wallet is optional by design (TICKET-046): **Sin cartera** remains a valid choice inside the popup and no validation code is added there.
- Deletion of `wallet-chips.ts` also removes the compact-limit behavior; nothing else reads the limit. Filters keep their own chip rendering.
- Copy proposal: `picker.select` "Seleccionar cartera" / "Select wallet", `picker.selectedAccessibility` "Cartera seleccionada: {{name}}. Cambiar" / "Selected wallet: {{name}}. Change", `picker.selectHint` "Abre la lista de carteras." / "Opens the wallet list."
- Out of scope: wallet creation from the picker, currency conversion, filters, and any schema, document or rules change (the validations already exist).

## Validation Plan
- Create a movement, a transfer pair and a shared expense with the registration toggle on: no wallet is preselected and the button reads **Seleccionar cartera**.
- Save each form without a wallet and confirm the translated field error appears and nothing is written.
- Select a wallet from the popup and confirm the button shows its name, the currency follows it and the error clears.
- Verify the transfer destination is disabled until a source exists and only lists same-currency wallets.
- Edit a movement, a transfer and a shared expense and confirm the stored wallet is shown and can be changed.
- Open the settlement wallet picker, choose **Sin cartera**, save and confirm no income is created.
- Check a single-wallet account: the popup opens and nothing is auto-selected.
- Check light/dark, Spanish/English and screen reader labels on the button and the popup.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-029 compact wallet selector (delivered; the chip model this ticket replaces)
- TICKET-046 optional creditor wallet in settlements (delivered)
- TICKET-055 optional wallet registration in shared expenses (delivered)
- TICKET-056 preferred-currency defaults (delivered; its preselection is removed here)
- TICKET-064 removes the currency chips from the settlement form, so the wallet field is the only remaining compact picker there
