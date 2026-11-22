# Single Wallet Picker Button Without Preselection (TICKET-065, 22/11/2026)

## Context

Every wallet field (movement, transfer source and destination, shared-expense wallet
while the TICKET-055 toggle is **Yes**, and the settlement's optional wallet) rendered a
compact row of up to three chips plus a `+` chip built by `WalletChipSelector` over
`getWalletChips` / `COMPACT_WALLET_LIMIT`. New movements, transfers and shared expenses
also started with a wallet already selected through `getDefaultWallet` and
`getDefaultTransferWallets` (TICKET-056), so the user could save a record without ever
choosing a wallet consciously.

## Decision

One trigger per field, no preselection.

- **Trigger:** `features/wallets/components/wallet-select-button.tsx`
  (`WalletSelectButton`) receives `wallet | null`, `disabled`, `hasError`,
  `accessibilityPrefix` and `onPress`. Empty shows **Seleccionar cartera**
  (`wallets:picker.select`); with a wallet it shows the wallet icon, name, currency and
  the archived badge. It always renders a chevron, keeps a 44pt+ target, uses the danger
  border on a field error and provides pressed/disabled feedback. It only opens the
  popup.
- **Popup:** `WalletPickerDialog` is unchanged except for an optional `noneOption` prop,
  rendered as the first row by the new
  `features/wallets/components/wallet-picker-none-option.tsx`
  (`WalletPickerNoneOption` / `WalletPickerNoneOptionRow`, selected when the id is empty,
  reports `onSelect("")`). The empty message, selected row, archived marker and
  read-only behavior stay as they were.
- **Deleted:** `wallet-chip-selector.tsx`, `wallet-chips.ts` (`getWalletChips`,
  `COMPACT_WALLET_LIMIT`) and `wallet-chips.test.ts`. The transaction and dashboard
  filters keep their own chip rendering and are untouched.

### Approved decisions

1. **Transfer destination:** it is cleared when the source changes and stays disabled
   until a source exists. The `form.noDestinations` notice only appears once a source is
   selected, so it never claims there are no destinations before the user picks one.
2. **Settlement "Sin cartera":** it moved from a chip next to the trigger to the first
   row of the picker popup (`noneOption`). The settlement wallet remains optional
   (TICKET-046) and no validation code was added for it.

## Defaults and validation

- `buildTransactionFormValues` and `buildTransferFormValues` no longer preselect a wallet
  and dropped the now-unused `wallets` parameter. New records start with an empty
  `walletId` (movements) or empty `fromWalletId`/`toWalletId` (transfers) and use the
  profile preferred currency as **provisional** currency; the selected wallet currency
  replaces it once a wallet exists. Edits keep the stored values.
- Save is never disabled for a missing wallet: submit runs the existing
  `WALLET_REQUIRED`, `FROM_WALLET_REQUIRED` and `TO_WALLET_REQUIRED` validation. The
  `canSubmit` plumbing was removed from the movement and transfer forms.
- `features/transactions/hooks/use-transaction-form.ts` already only synced the currency
  from the chosen wallet, so the requirement to remove a wallet default applied on type
  or currency change had no counterpart and nothing was removed there.
- Copy: `picker.select` and `picker.selectedAccessibility` added, `picker.selectHint`
  updated, `picker.selectAccessibility` kept. Removed the unused
  `settlements.form.walletChipAccessibility` and `sharedExpenses.form.walletGroupAccessibility`.

## Consequences

- Every wallet field is a single button, the wallet is always chosen explicitly and the
  picker never auto-selects, even with one available wallet.
- Movements and transfers cannot be saved without a wallet, but the error now appears on
  submit instead of the button being disabled beforehand.
- TICKET-066 (single category picker with mandatory selection) can reuse the same trigger
  and popup contract.

## Verification

- `npx tsc --noEmit` clean, `npx expo lint` clean, `npx jest` 331 suites / 2026 tests
  passed, coverage 98.92 % statements / 94.74 % branches / 98.49 % functions / 99.5 %
  lines, `npm run check:copy` passed (310 TSX files).
- No schema, document, service, repository, money, rules or route change; nothing to
  deploy.
- Pending: manual device validation (light/dark, screen reader and the real forms).
