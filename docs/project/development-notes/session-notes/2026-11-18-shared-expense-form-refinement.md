# Shared-expense form refinement (decision record)

**Date:** 18/11/2026
**Scope:** docs only — TICKET-055 and TICKET-056 created
**Status:** decided, not implemented

## Context

Two product questions arrived after the 1:1 settlement closed:

1. a viewer-paid shared expense should not always touch the personal wallets;
2. the shared-expense form should show the currency the way the user expects and
   help finish the **Importe** split without doing the math by hand.

The first one reverses a delivered rule (TICKET-048 made the wallet mandatory),
so it needs a decision record instead of a silent edit. The second one is
presentation only, but it changes a shared molecule and the default wallet of two
other forms, so it is recorded next to it.

## Decisions

### 1. Wallet registration becomes opt-in (TICKET-055, V1 Phase 5.3)

- When the viewer is the payer, a **Yes/No** toggle
  (`¿Registrar el gasto en una cartera?`) controls the wallet and category block.
- **No** is the default for a new expense and is configurable in Settings.
- **No**: no wallet, no category, no personal movement, no balance change; the
  expense lives only in the shared ledger.
- **Yes**: wallet + category required (TICKET-051) and one linked movement.
- The pair debt is identical in both cases: `buildExpenseLedgerEntries` never
  reads `walletId`; the toggle only decides the viewer's personal side.
- The toggle state is **derived** from the link (`walletId`/`categoryId`/
  `linkedTransactionId`), not stored as a new boolean, so the UI cannot disagree
  with the data or the balance.
- The default lives in the `users` profile document
  (`registerSharedExpensesInWallet`, missing = `false`). No rules change: the
  owner update only locks `uid`. AsyncStorage was rejected because the choice
  should follow the account like the preferred currency.
- TICKET-048's payer-wallet Firestore rule must be relaxed in the same change;
  that rule edit keeps its manual deployment.

### 2. The currency becomes a compact row (TICKET-056, V1 Phase 5.3)

- The chip list inside the shared-expense form is replaced by
  **Moneda: EUR € · Cambiar**, with **Cambiar** as a small text action in the
  primary color (≥44x44 hit area) that opens a picker dialog.
- The chip selector survives as the dialog content, so there is one currency
  model and no second list to maintain.
- New expenses already default to the profile preferred currency; that stays.
- Changing the currency reuses `selectSharedExpenseCurrency`, which already
  clears an incompatible wallet and its category.
- The compact field is extracted as a shared molecule and reused by the wallet
  form.
- Movement and transfer keep the currency tied to the wallet, but a new record
  preselects an active wallet in the preferred currency when one exists, instead
  of always taking the first wallet.

### 3. The fixed split shows what is missing (TICKET-056)

- Below the participant inputs in **Importe** mode: `Total 100,00 € ·
  Falta: 25,00 €`, recalculated on every keystroke.
- At zero it shows **Completo**; over the total, **Sobra: X** with error styling.
- Integer cents for the math, locale formatting at the render boundary.
- Presentation only: `FIXED_SUM_MISMATCH` and the existing validation still
  decide whether the form saves.

## Alternatives considered

- **Keep the wallet mandatory (TICKET-048 as is).** Rejected: it forces a
  personal movement (and a category) on users who only want the social record.
- **Store a per-expense boolean for the toggle.** Rejected: it duplicates the
  link fields and can drift from the balance.
- **Keep the chips and just add a "Cambiar" label.** Rejected: the point is to
  stop rendering every currency in a form that only needs the current one.
- **Free currency selection in movements/transfers.** Rejected: the wallet owns
  the currency; letting the forms disagree would break the balance invariant.
- **Show the remaining amount only on submit.** Rejected: the user asked for
  live feedback while typing, which is where the friction is.

## Consequences

- TICKET-055 changes a shipped rule and touches the `users` profile, the
  shared-expense schema/service, the existing linked-movement operations and the
  `sharedExpenses` rules; it needs a full regression pass on the wallet, the
  movement and the pair balance.
- TICKET-056 adds a shared molecule (`CurrencyField` + picker) and a pure
  remaining helper; the wallet form, the movement form and the transfer form
  inherit a small default change.
- Group expenses in Phase 6 must reuse the same toggle and the same compact
  currency field.
- Current Focus is untouched: TICKET-047 stays the next ticket.

## Open questions

- Should the toggle remember the last choice per expense, or always start from
  the Settings preference?
- Should the movement and transfer forms also display the currency explicitly
  (read-only) now that the compact field exists?
- Does the remaining line belong only to **Importe**, or also to **Porcentaje**
  (missing basis points) and **Partes** (missing shares)?

## Related

- `docs/project/tickets/TICKET-055-SHARED-EXPENSE-OPTIONAL-WALLET.md`
- `docs/project/tickets/TICKET-056-SHARED-EXPENSE-CURRENCY-AND-REMAINING.md`
- `docs/project/tickets/[DONE] TICKET-048-MANDATORY-WALLET-VIEWER-PAID.md`
- `docs/project/tickets/[DONE] TICKET-051-MANDATORY-SHARED-EXPENSE-CATEGORY.md`
