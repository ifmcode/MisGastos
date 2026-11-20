# TICKET-065 - Single Wallet Picker Button Without Preselection

**Type:** UX  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** TICKET-029, TICKET-046, TICKET-055, TICKET-056, TICKET-064  
**Sprint:** Post-MVP / Phase 6.0

## Description
Every wallet field renders up to three wallet chips plus a small `+` chip that opens the full picker, and new records start with a wallet already selected. Replace that row with one explicit **Seleccionar cartera** button (the chosen wallet's name once there is a selection) and stop preselecting a wallet in movements, transfers and shared expenses, so the user always chooses consciously and an empty wallet shows the existing validation error.

## Requirements
- [ ] Add one wallet control that reads **Seleccionar cartera** when empty and the selected wallet name (plus its archived/currency marker when relevant) once chosen, with a chevron and a 44pt+ touch target
- [ ] Replace `features/wallets/components/wallet-chip-selector.tsx` in all five call sites: movement wallet, transfer source, transfer destination, shared-expense wallet while the TICKET-055 toggle is **Yes**, and the settlement's optional wallet
- [ ] Keep `features/wallets/components/wallet-picker-dialog.tsx` as the popup, including the empty message, selected row, archived marker and read-only behavior
- [ ] Delete `features/wallets/utils/wallet-chips.ts` (`getWalletChips`, `COMPACT_WALLET_LIMIT`) and its tests once no consumer remains
- [ ] Remove the wallet default in `features/transactions/utils/transaction-form-defaults.ts` (`getDefaultWallet`): new movements start with an empty `walletId`, keep the profile preferred currency as the provisional currency and take the wallet currency once one is selected
- [ ] Remove the preselection in `features/transfers/utils/transfer-form-defaults.ts` (`getDefaultTransferWallets`): both ids start empty, the provisional currency is the profile preferred currency, and the destination stays filtered by and disabled until a source is chosen
- [ ] Remove the wallet default applied on type or currency change in `features/transactions/hooks/use-transaction-form.ts`
- [ ] Rely on the existing `WALLET_REQUIRED`, `FROM_WALLET_REQUIRED` and `TO_WALLET_REQUIRED` codes, show them on submit and never disable the save button for a missing wallet
- [ ] Keep the picker usable with a single available wallet and never auto-select it
- [ ] Keep the stored wallets when editing a movement, transfer or shared expense; the settlement keeps its optional **Sin cartera** and archived handling
- [ ] Leave the transaction filters and the dashboard wallet filter untouched: they filter a list and are not required fields
- [ ] Add the button and selected-state copy to `features/wallets/locales/{es,en}.json`, keep `picker.selectAccessibility` = **Seleccionar cartera**, and run `npm run check:copy`
- [ ] Update the defaults and selector tests, delete the chip-util tests, and run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [ ] Every wallet field shows a single **Seleccionar cartera** button instead of a chip list
- [ ] No new movement, transfer or shared expense starts with a wallet selected
- [ ] Saving without a wallet is blocked with the translated field error, and the error disappears once a wallet is chosen
- [ ] The button shows the chosen wallet and reopening the popup changes it
- [ ] A transfer cannot choose a destination before a source, and the destination only lists the source currency
- [ ] Editing keeps the stored wallets; the settlement still accepts **Sin cartera**
- [ ] The picker opens with one wallet and requires an explicit tap
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

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
