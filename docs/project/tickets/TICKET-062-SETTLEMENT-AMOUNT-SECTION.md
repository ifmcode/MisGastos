# TICKET-062 - Settlement Amount Section with Live Remaining Debt

**Type:** UX  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** TICKET-046, TICKET-064, TICKET-010  
**Sprint:** Post-MVP / Phase 6.0

## Description
The settlement form asks the user to choose **Toda la deuda** or **Parte de la deuda** before typing anything: `components/settlement-form-mode-chips.tsx` drives `SettlementAmountMode` and the amount is prefilled and read-only in total mode. Replace that choice with one editable **Importe a liquidar** section: the amount opens with the full outstanding debt of the selected currency, it stays editable, and a live message under the field says how much is left. The group settlement (TICKET-010) must reuse the same section instead of a second amount implementation.

## Requirements
- [ ] Delete `components/settlement-form-mode-chips.tsx` and every `mode` / `selectSettlementMode` / `changeMode` path: `utils/settlement-form.types.ts` (`SettlementAmountMode`), `utils/settlement-form-values.ts` (`selectSettlementMode`, the `mode` field in both defaults builders and in `selectSettlementCurrency`), the `utils/settlement-form.ts` re-export, `hooks/use-settlement-form.ts` (`changeMode`) and `hooks/settlement-form-controller.types.ts` (`changeMode`)
- [ ] Render one amount section in `components/settlement-form-main-fields.tsx` with the label **Importe a liquidar**, the amount field and the live message directly under it
- [ ] Keep the amount editable in create and in edit; no total/partial switch anywhere in the form
- [ ] Keep the existing bound: the amount must be greater than zero and never above the outstanding debt of the selected currency
- [ ] Keep the currency selector for now; TICKET-064 owns the new debt-selection step and removes it later
- [ ] Preserve the TICKET-046 amount lock (`amountLocked` from `hooks/use-settlement-editor.ts`, `form.amountLocked`): a locked amount stays read-only and keeps the `form.amountLocked` helper
- [ ] Prefill the full outstanding debt on create and the stored `amountCents` on edit, where the bound is the debt excluding the settlement being edited
- [ ] Changing currency prefills the full debt of the newly selected currency
- [ ] Show three live states under the amount: remaining, exactly settled, and exceeds the debt
- [ ] Announce the live message politely without moving focus (`accessibilityLiveRegion="polite"` or the equivalent accessible summary)
- [ ] Add a pure helper that derives the live state from the amount text and the debt cents, with colocated tests covering under, exact, above and unparseable input
- [ ] Add `form.amountSectionLabel`, `form.amountRemaining` and `form.amountSettled` to `features/settlements/locales/{es,en}.json`; rename `form.modeLabel` to `form.amountSectionLabel` and delete `form.modeTotal`, `form.modePartial` and `form.modeAccessibility` so no `form.mode*` key survives
- [ ] No schema, document, rules or ledger change: `mode` was UI-only and never reached `settlements/{settlementId}`
- [ ] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [ ] The amount opens prefilled with the full outstanding debt and can be edited without switching anything first
- [ ] The live message updates while typing and states the remaining debt in integer cents rendered as currency
- [ ] When the amount equals the debt the message says the debt would be settled
- [ ] Saving a lower amount applies a partial settlement and the rest of the debt stays visible in the pair balance
- [ ] Saving the exact debt clears that currency's balance
- [ ] Editing an existing settlement keeps the stored amount prefilled and the same live message
- [ ] The amount lock from TICKET-046 still blocks editing once the creditor linked a movement
- [ ] The group settlement reuses this same section, not a second amount flow
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Technical Notes
- Current amount path: `createSettlementFormValues` starts `mode: "total"` and prefills `formatSettlementAmountInput(first.debtCents)`; `getSettlementAmountIssue` returns `null` while `mode === "total"`, so removing the mode requires deleting that early return and validating the trimmed amount in both create and edit.
- Debt per currency still comes from `getSettlementCurrencyOptions(balances)` in `utils/settlement-form-currency.ts`; the bound is `option.debtCents` on create and `getSettlementEditableNetCents` on edit.
- Suggested helper: `utils/settlement-amount-status.ts` with a function returning `"remaining" | "settled" | "exceeds" | null`, reusing `amountToCents` so the parse rules stay identical to the submission path.
- The live message shares the field's helper slot, so a validation error takes precedence over the message and the message never duplicates the `errors.AMOUNT_EXCEEDS_DEBT` copy.
- Integer cents only: derive the remaining amount from the parsed cents, never from floats.
- Proposed copy (`features/settlements/locales/es.json` / `en.json`):
  - `form.amountSectionLabel`: "Importe a liquidar" / "Amount to settle"
  - `form.amountRemaining`: "Te faltan {{amount}} para saldar la deuda." / "{{amount}} left to settle the debt."
  - `form.amountSettled`: "Con este importe la deuda queda saldada." / "With this amount the debt is settled."
- `form.subtitle` ("Liquida total o parcialmente la deuda con {{name}}.") stays valid: partial settlements are still supported, only the switch disappears.
- Ordering with TICKET-064: this ticket keeps the in-form currency selector because it can ship first. If TICKET-064 ships first, that requirement is already gone and the amount section only receives the currency chosen in the debt step; no other part of this ticket changes.
- Out of scope: the currency selector, the debt-selection step (TICKET-064), the wallet/category link (TICKET-065/TICKET-066) and any ledger or rules change.

## Validation Plan
- Open the create screen with a debt in EUR: the amount is prefilled with the whole debt and the message says the debt is settled.
- Type a lower amount and confirm the message states the remaining amount; save and confirm the pair balance keeps the rest.
- Type the exact debt, save and confirm the currency balance disappears.
- Save an amount above the debt and confirm the bound blocks it with the translated error.
- Edit an existing settlement: the stored amount is prefilled and the lock appears only when the creditor has a linked movement.
- Switch currency on create and confirm the new currency's full debt is prefilled.
- Check light/dark, Spanish/English and screen reader: the message is announced without stealing focus.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-046 1:1 settlement with direct application (delivered; amount lock and bound live there)
- TICKET-064 debt-selection step (renders this section for the chosen currency and removes the currency chips)
- TICKET-010 group settlement (must reuse this section)
