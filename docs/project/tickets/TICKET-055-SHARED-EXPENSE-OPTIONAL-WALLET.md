# TICKET-055 - Optional Wallet Registration for Shared Expenses

**Type:** Feature  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** TICKET-006, TICKET-042, TICKET-044, TICKET-048, TICKET-049, TICKET-050, TICKET-051  
**Sprint:** Post-MVP / Phase 5.3

## Description
TICKET-048 made the wallet mandatory whenever the viewer pays, so a viewer-paid shared expense always appears in **Movimientos**. That solved the silent trap but removed a legitimate case: a user who does not want a shared dinner touching their personal wallets. This ticket turns the rule into an explicit choice. When the viewer pays, a **Yes/No** toggle at the end of the form (`¿Registrar el gasto en una cartera?`) controls the wallet and category block. **No** is the default for a new expense and can be changed in Settings; **Yes** keeps the TICKET-048 + TICKET-051 behaviour (wallet and category required, exactly one linked personal movement); **No** hides the block, clears `walletId`/`categoryId`, writes no movement and changes no balance, so the expense lives only in the shared ledger. The pair debt is identical either way: the toggle only decides the viewer's personal side. It supersedes TICKET-048's mandatory-wallet rule and keeps TICKET-051's mandatory category whenever the toggle is **Yes**. The toggle exists only when the viewer is the payer; a friend-paid expense keeps no toggle and no block.

## Requirements
### Form
- [ ] Add a **Yes/No** toggle at the end of the shared-expense form (`¿Registrar el gasto en una cartera?`) and render it only when the viewer is the payer, so a friend-paid expense keeps no toggle and no wallet/category block
- [ ] Default the toggle to **No** for a new expense and to **Yes** when editing an expense that already carries a linked wallet or movement; the new-expense default comes from the user preference
- [ ] Derive the toggle state from the linked wallet/movement instead of storing a new per-expense boolean, so the stored data cannot drift from the UI (see the decision note)
- [ ] **Yes:** show the wallet and category fields, offer only the viewer's active same-currency wallets, require both (TICKET-051) and keep the no-compatible-wallet guidance pointing to **Carteras** while blocking the save
- [ ] **No:** hide the block, clear `walletId`/`categoryId` in the form state, create no movement and change no wallet balance
- [ ] On edit, switching **Yes → No** reverts the linked movement and its balance exactly once and soft-deletes the movement; **No → Yes** creates it exactly once; repeated saves never duplicate the movement or re-apply the balance
- [ ] Load legacy viewer-paid expenses with a linked movement as **Yes** and those without as **No**, without a notice that blocks reading or saving
- [ ] Keep the toggle disabled while the form is submitting and reset it with the rest of the form values when the modal opens for another expense

### Settings preference
- [ ] Add a Settings switch (`Registrar los gastos compartidos en una cartera por defecto`) that persists the preference and explains that it only affects new expenses
- [ ] Persist the preference as a boolean on the `users` profile document (missing = `false`), extending the profile type, the mapper fallback, the save input/schema and the Firestore save
- [ ] Changing the preference never rewrites an existing shared expense: it is read when a new form is created and ignored while editing
- [ ] Confirm no Firestore rules change is needed: the owner `users` update only requires `uid` to stay unchanged

### Coherence and errors
- [ ] Enforce the rule in the schema: registration `true` requires `walletId` and `categoryId`; registration `false` must not carry `walletId`, `categoryId` or a linked movement id
- [ ] Enforce the same rule in the service before any write and reject with translated codes (reuse `WALLET_REQUIRED`/`CATEGORY_REQUIRED` and add a code for a link that contradicts the toggle)
- [ ] Keep the atomic write: the linked movement, its wallet balance and the shared expense stay in the same `runTransaction` behind the existing linked-movement port
- [ ] Confirm the pair balance, the friend ledger and the **Movimientos** visibility only depend on whether the toggle is **Yes**, never on the preference default

### Copy and accessibility
- [ ] Add es/en copy in the `sharedExpenses` and `settings` namespaces for the toggle label, its helper text, both options, the Settings label/helper and every accessibility label/hint
- [ ] Expose the toggle with the switch role, `accessibilityState.checked`, a label and a hint; keep it usable in dark mode
- [ ] Keep domain errors as codes mapped in the UI and pass `npm run check:copy`

### Verification
- [ ] Add colocated tests for the default resolution (new expense with the preference on/off, edit with and without a link), the toggle visibility, the schema and service coherence cases, the **Yes → No** reversion, the **No** case creating no movement, the preference persistence and the Settings switch
- [ ] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [ ] A viewer-paid expense saved with the toggle on **No** creates no personal movement, leaves **Movimientos** untouched and produces the same pair debt as the same expense saved with **Yes**
- [ ] A viewer-paid expense saved with the toggle on **Yes** creates exactly one linked movement and requires both a wallet and a category
- [ ] Switching **Yes → No → Yes** on edit reverts the movement and its balance exactly once and recreates it exactly once, with no duplicate after repeated saves
- [ ] A new expense defaults to the stored preference, while editing an existing expense shows its own state regardless of the current preference
- [ ] Only the payer sees the toggle; a friend-paid expense shows neither the toggle nor the wallet/category block
- [ ] Legacy viewer-paid expenses load with the state their stored link implies (movement = **Yes**, no movement = **No**)
- [ ] Changing the Settings switch does not modify any existing expense
- [ ] The toggle, the Settings switch and the new errors are readable in light/dark mode and Spanish/English, with screen-reader labels
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Technical Notes
- **Supersedes TICKET-048, not TICKET-044:** the linked movement, the atomic operations and the payer transitions stay exactly as delivered. TICKET-048 only decided *when* a link is required; this ticket replaces "always, when the viewer pays" with "only when the toggle is **Yes**". The `sharedExpenses` payer-wallet rule added by TICKET-048 has to be relaxed in the same change (it currently rejects any viewer-paid write without a `walletId`), and that rules edit keeps its manual deployment.
- **TICKET-051 is untouched:** a linked movement still requires an explicit `categoryId` and no **Gastos compartidos** default is created or applied. `categoryId` stays `null` exactly when there is no link.
- **The toggle is derived, not stored:** `walletId`/`categoryId`/`linkedTransactionId` already describe the link, so a stored boolean would be a second source of truth that could disagree with them and with the wallet balance. The form keeps a transient switch value that resolves to **Yes** when the expense has a link, and the schema derives the requirement from the same ids. `features/shared-expenses/utils/shared-expense-form-load.ts` (`fromSharedExpense` / `getSharedExpenseInitialValues`) is the natural place for the resolution.
- **The pair is unaffected:** `buildExpenseLedgerEntries` derives the debt from the expense amount, payer and shares, and never reads `walletId`. The linked movement is the viewer's personal record of the same spend; skipping it changes the viewer's wallets and **Movimientos**, never what the friend owes.
- **Preference lives in `users`:** `Profile` (`features/profile/types/profile.types.ts`) already reads `preferredCurrency` from that document, and `repositories/profile.mapper.ts` falls back field by field so a missing boolean resolves to `false`. `repositories/firebase-profile.repository.ts` writes an explicit field list, so the new field must be added there too. Rejected alternative: `AsyncStorage`, because a preference about the account should follow the user across devices, like the preferred currency; the theme and language stay local because they are device presentation choices.
- **No rules change for the preference:** the `users` update rule only checks owner and immutable `uid` (`firestore.rules` → `match /users/{userId}`), so an extra boolean passes without edits. The `sharedExpenses` rule *does* change, for the reason above.
- **One atomic write:** the toggle must not introduce a second transaction or an "unlink later" path. `shared-expense-create-link.operation.ts` / `shared-expense-update-link.operation.ts` behind `ILinkedMovementPort` already revert and re-apply the balance once, which is what the **Yes → No → Yes** case needs.
- **Groups reuse it:** the Phase 6 group expense form should expose the same toggle with the same default and the same derived state, so the shared-expense choice is not re-invented there.
- **Decision record:** `docs/project/development-notes/session-notes/2026-11-18-shared-expense-form-refinement.md`.
- **Out of scope:** remembering the last choice per expense or per friend, wallet registration for friend-paid expenses (the other participant owns that movement), a per-group default, and migrating legacy records (they already carry the information the toggle derives from).

## Validation Plan
- Set the Settings switch to off, create a viewer-paid expense and confirm **Movimientos** and the wallet balance do not change while the friend detail shows the debt.
- Set the switch to on, create the same expense and confirm exactly one **Compartido** movement and the wallet balance change.
- Edit a **Yes** expense to **No** and confirm the movement disappears and the balance is restored once; switch back to **Yes** and confirm the movement is recreated once; save twice without changing anything and confirm no duplicate.
- Change the Settings default and confirm only new expenses follow it while an existing expense keeps its state.
- Open a legacy viewer-paid expense with a linked movement (expect **Yes**) and one without (expect **No**) and confirm both save correctly.
- Check that a friend-paid expense shows no toggle and no block.
- Verify the toggle and the Settings switch with a screen reader, in light/dark mode and in Spanish/English.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-044 linked movement and atomic payer/link transitions
- TICKET-048 mandatory wallet when the viewer pays (superseded by this ticket)
- TICKET-051 mandatory category for a linked movement (still applies when the toggle is **Yes**)
- TICKET-006 profile and preferred currency (the `users` document that now also stores the default)
