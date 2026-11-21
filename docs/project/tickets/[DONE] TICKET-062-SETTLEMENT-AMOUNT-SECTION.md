# [DONE] TICKET-062 - Settlement Amount Section with Live Remaining Debt

**Type:** UX  
**Priority:** High  
**Status:** ✅ Done (21/11/2026)  
**Related:** TICKET-046, TICKET-064, TICKET-010  
**Sprint:** Post-MVP / Phase 6.0

## Description
The settlement form asks the user to choose **Toda la deuda** or **Parte de la deuda** before typing anything: `components/settlement-form-mode-chips.tsx` drives `SettlementAmountMode` and the amount is prefilled and read-only in total mode. Replace that choice with one editable **Importe a liquidar** section: the amount opens with the full outstanding debt of the selected currency, it stays editable, and a live message under the field says how much is left. The group settlement (TICKET-010) must reuse the same section instead of a second amount implementation.

## Requirements
- [x] Delete `components/settlement-form-mode-chips.tsx` and every `mode` / `selectSettlementMode` / `changeMode` path: `utils/settlement-form.types.ts` (`SettlementAmountMode`), `utils/settlement-form-values.ts` (`selectSettlementMode`, the `mode` field in both defaults builders and in `selectSettlementCurrency`), the `utils/settlement-form.ts` re-export, `hooks/use-settlement-form.ts` (`changeMode`) and `hooks/settlement-form-controller.types.ts` (`changeMode`)
- [x] Render one amount section in `components/settlement-form-main-fields.tsx` with the label **Importe a liquidar**, the amount field and the live message directly under it
- [x] Keep the amount editable in create and in edit; no total/partial switch anywhere in the form
- [x] Keep the existing bound: the amount must be greater than zero and never above the outstanding debt of the selected currency
- [x] Keep the currency selector for now; TICKET-064 owns the new debt-selection step and removes it later
- [x] Preserve the TICKET-046 amount lock (`amountLocked` from `hooks/use-settlement-editor.ts`, `form.amountLocked`): a locked amount stays read-only and keeps the `form.amountLocked` helper
- [x] Prefill the full outstanding debt on create and the stored `amountCents` on edit, where the bound is the debt excluding the settlement being edited
- [x] Changing currency prefills the full debt of the newly selected currency
- [x] Show three live states under the amount: remaining, exactly settled, and exceeds the debt
- [x] Announce the live message politely without moving focus (`accessibilityLiveRegion="polite"` or the equivalent accessible summary)
- [x] Add a pure helper that derives the live state from the amount text and the debt cents, with colocated tests covering under, exact, above and unparseable input
- [x] Add `form.amountSectionLabel`, `form.amountRemaining` and `form.amountSettled` to `features/settlements/locales/{es,en}.json`; rename `form.modeLabel` to `form.amountSectionLabel` and delete `form.modeTotal`, `form.modePartial` and `form.modeAccessibility` so no `form.mode*` key survives
- [x] No schema, document, rules or ledger change: `mode` was UI-only and never reached `settlements/{settlementId}`
- [x] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [x] The amount opens prefilled with the full outstanding debt and can be edited without switching anything first
- [x] The live message updates while typing and states the remaining debt in integer cents rendered as currency
- [x] When the amount equals the debt the message says the debt would be settled
- [x] Saving a lower amount applies a partial settlement and the rest of the debt stays visible in the pair balance
- [x] Saving the exact debt clears that currency's balance
- [x] Editing an existing settlement keeps the stored amount prefilled and the same live message
- [x] The amount lock from TICKET-046 still blocks editing once the creditor linked a movement
- [x] The group settlement reuses this same section, not a second amount flow
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Implemented

Delivered and verified on 21/11/2026. Session note:
[`session-notes/2026-11-21-settlement-amount-section.md`](../development-notes/session-notes/2026-11-21-settlement-amount-section.md).

### Form state
- Deleted `features/settlements/components/settlement-form-mode-chips.tsx` and every `mode` path: `SettlementAmountMode`, `mode`, `selectSettlementMode` and `changeMode` left `utils/settlement-form.types.ts`, `utils/settlement-form-values.ts`, `utils/settlement-form.ts`, `hooks/use-settlement-form.ts` and `hooks/settlement-form-controller.types.ts`.
- The total-mode re-sync effect left `hooks/use-settlement-form-state.ts`. A debt refresh now only moves the bound; a refresh that changes the default currency still replaces the draft, because the reset key is still `viewerUid | friendUid | currency`.
- Create prefills the full debt of the first debt currency and edit prefills the stored `amountCents`; `selectSettlementCurrency` always prefills the full debt of the newly selected currency. The edit bound still excludes the settlement itself (`getSettlementEditableNetCents` in `hooks/use-settlement-editor.ts`).
- `createSettlementEditFormValues` dropped the now-unused `currentNetCents` parameter.

### Amount section and helper
- `features/settlements/components/settlement-form-main-fields.tsx` renders one section: label `form.amountSectionLabel` (**Importe a liquidar**), the shared `AmountField` always editable (`disabled={disabled || amountLocked}`) and the live line in the field's helper slot.
- New pure helper `features/settlements/utils/settlement-amount-status.ts`: `getSettlementAmountState(amountText, debtCents)` returns `{ status: "remaining" | "settled" | "exceeds", remainingCents }` or `null`. It parses through `amountToCents`, so the message and the submit path agree; empty, blank, unparseable and zero amounts and a non-finite debt return `null`, cents are rounded to integers and the remaining amount is never negative. Exported through `utils/settlement-form.ts`.
- Mapping: `remaining` → `form.amountRemaining` with the difference formatted as currency, `settled` → `form.amountSettled`, `exceeds` → no helper, because `AMOUNT_EXCEEDS_DEBT` already renders as the field error (no duplicated copy), and `null`/locked → `form.amountLocked` with no live message.

### Validation, prefill and bound
- `utils/settlement-form-input.ts` `getSettlementAmountIssue` no longer bypasses validation in total mode: empty → `AMOUNT_REQUIRED`, zero or unparseable → `AMOUNT_INVALID`, above the debt → `AMOUNT_EXCEEDS_DEBT`, in create and in edit.
- `components/settlement-form-body.tsx` counts `form.amountIssue` as a field error, so the amber `form.validationSummary` notice appears whenever the live amount blocks the save, not only for date or field errors. A settled or remaining amount never blocks it.
- `components/settlement-create-screen.tsx` falls back to `debtCents = 0` instead of another currency's debt, so a currency that disappears mid-form can never borrow the first option's bound.

### Shared `AmountField` and accessibility
- `shared/components/molecules/amount-field.tsx` gained optional `helperLive?: boolean` (default `false`): it marks the helper as `accessibilityRole="text"` + `accessibilityLiveRegion="polite"` for Android and queues an iOS-only `announceForAccessibilityWithOptions(..., { queue: true })`. The mount/prefill value is skipped so the screen reader is not interrupted when the form opens, and nothing is announced while an error is shown.
- Other `AmountField` consumers are unchanged because the prop defaults to `false`.

### Copy and styles
- Locales es/en: `form.modeLabel` renamed to `form.amountSectionLabel`, `form.modeTotal`/`form.modePartial`/`form.modeAccessibility` deleted and the unused `form.amountLabel` removed. Added `form.amountRemaining` ("Te faltan {{amount}} para saldar la deuda." / "{{amount}} left to settle the debt.") and `form.amountSettled` ("Con este importe la deuda queda saldada." / "With this amount the debt is settled."). `form.subtitle` is unchanged, since partial settlements are still supported.
- Removed the dead `debtAmount`/`textInput` styles from `features/settlements/styles/settlements.styles.ts`.

### Group reuse
- Guaranteed by construction: there is one `SettlementForm`/`SettlementFormMainFields` amount section plus the pure helper, and no second amount flow exists. TICKET-010 must consume this section; that stays TICKET-010's contract.

### Tests and verification
- Colocated `features/settlements/utils/__tests__/settlement-amount-status.test.ts` covers under, exact, above, comma decimals, cent rounding, empty/blank, unparseable, zero, non-finite and zero debt at 100 % coverage.
- `features/settlements/utils/__tests__/settlement-form.test.ts` updated: create/edit defaults, currency prefill, amount issues (empty, zero, comma, exact, above and a zero debt), no `mode`, and a positive-net create prefill case.
- `npx tsc --noEmit` pass, `npx expo lint` pass, `npx jest` 330 suites / 2026 tests pass, `npm run test:coverage` global 98.92 % statements, 94.69 % branches, 98.57 % functions and 99.5 % lines (gate intact, new helper at 100 %), `npm run check:copy` 307 TSX files.
- No schema, document, service, repository, ledger, rules or index change: `mode` was UI-only and never reached `settlements/{settlementId}`.

### Review and deferred items
- Independent `reviewer`: verdict `approve with nits`. Fixed before closing: the missing `form.amountIssue` in the validation notice, the iOS mount/interrupting announcement (now skipped on mount and queued), the create-screen `debtCents` fallback, the `use-settlement-form-state` doc comment, the dead styles and two test gaps.
- Deferred: extracting a standalone `SettlementAmountSection` when TICKET-010 starts (this ticket asked for the section inside `settlement-form-main-fields.tsx` for now); the pre-existing precedence of a server `fieldErrors.amount` after the user edits a rejected save stays a known edge.
- Pending manual validation: device and screen-reader checks (iOS VoiceOver + Android TalkBack), light/dark and es/en.

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
