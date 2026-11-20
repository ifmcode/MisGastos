# TICKET-064 - Settlement Debt Selection Step for Multiple Currencies

**Type:** UX  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** TICKET-042, TICKET-046, TICKET-062, TICKET-010  
**Sprint:** Post-MVP / Phase 6.0

## Description
When two people owe each other in more than one currency, `/social/settlements/new` currently jumps into the form with the first currency preselected and a currency chip row on top. Insert a step before the form that lists every currency with its outstanding debt and direction; tapping one opens the settlement form locked to that currency. When only one currency has debt, the step never appears and the form opens directly.

## Requirements
- [ ] Add a debt-selection step that lists one row per currency with a real debt: currency code and symbol, outstanding amount, direction (**Yo pago** / **Me paga**) and a chevron
- [ ] Show the step from `/social/settlements/new?friendUid=…` only when the pair has two or more debt currencies
- [ ] Open the form from the selected row through the same route with a `currency=<code>` param, pushing (not replacing) so back returns to the step and the step's back returns to the friend detail
- [ ] Skip the step and open the form directly when exactly one currency has debt
- [ ] Remove `components/settlement-form-currency-chips.tsx`, `utils/settlement-form-values.ts#selectSettlementCurrency` and the currency block from `components/settlement-form-main-fields.tsx`
- [ ] Pass the chosen currency into `createSettlementFormValues` instead of reading the first option, and keep the currency immutable inside the form
- [ ] Fall back to the step on create when the `currency` param is missing, unknown or has no debt; never settle a silently defaulted currency. The edit route keeps the stored currency and never shows the step
- [ ] Reuse the existing loading, error, missing and empty states of `SettlementCreateScreen` and add step-specific empty copy when the debt disappears while the step is open
- [ ] Add `form.debtStep.*` copy to `features/settlements/locales/{es,en}.json`: title, subtitle with the friend name, row accessibility label, list accessibility label and the empty message
- [ ] Add tests for the step/form decision (0, 1 and 2+ options) and for resolving the `currency` param; keep the direction and amount bound tests untouched
- [ ] No schema, document, rules or ledger change: the chosen currency already exists in `settlements/{settlementId}`

## Acceptance Criteria
- [ ] With two debt currencies the user chooses which debt to settle before seeing the amount
- [ ] The form opens in the chosen currency, prefilled with that currency's debt, and offers no way to switch currency inside it
- [ ] With a single debt currency the step is skipped
- [ ] A currency without debt is never offered and a forged `currency` param falls back to the step
- [ ] Back from the form returns to the step; back from the step returns to the friend detail
- [ ] Both rows show the correct direction and amount, grouped per currency with no conversion
- [ ] Edit shows no step and keeps the stored currency
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Technical Notes
- Current path: `app/social/settlements/new.tsx` reads only `friendUid`; `hooks/use-settlement-create-screen.ts` derives `options` from `friend.balances` with `getSettlementCurrencyOptions` and `createSettlementFormValues` takes the first option; `settlement-form-currency-chips.tsx` renders the remaining currencies.
- Suggested split: `components/settlement-debt-select-screen.tsx` (loading/error/empty + list shell) and `components/settlement-debt-option.tsx` (one row), mirroring the `settlement-form-*` split so every file stays under 150 lines. The navigation callback is created in the route screen, not in the row.
- The route stays `/social/settlements/new` with an optional `currency` param, so `PRIVATE_SEGMENTS`, deep links and the friend detail entry point (`FriendDetailSettleButton`) do not change.
- Decide inside the screen controller between `status: "select"` and `status: "ready"`: `options.length === 1` resolves the only option, `options.length > 1` with no valid param resolves `"select"`, and a valid param resolves `"ready"` with that option. This keeps the decision pure and testable.
- Amount formatting reuses `formatSettlementAmountInput`/the locale currency formatter; the direction reuses `viewerIsCreditorFor` and the existing `settlements:direction.*` copy instead of adding a new label.
- Group settlement (TICKET-010) reuses this step per group currency; only the balance source changes, the row contract and the skip-the-step rule stay the same.
- Copy proposal: `form.debtStep.title` "¿Qué deuda quieres liquidar?", `form.debtStep.subtitle` "Elige la moneda de la deuda con {{name}}.", `form.debtStep.rowAccessibility` "Liquidar la deuda de {{amount}} en {{currency}}", `form.debtStep.listAccessibility` "Deudas pendientes por moneda", `form.debtStep.empty` "No hay deuda que liquidar." (English equivalents in `en.json`).
- Out of scope: the editable amount and live remaining message (TICKET-062), the wallet/category link (TICKET-065/TICKET-066), group balances (TICKET-010) and any document or rules change.

## Validation Plan
- Settle a pair with EUR and USD debt: the step lists both, each row opens its currency with the right amount and direction.
- Settle a pair with a single currency: the step never appears.
- Open the route with a missing, unknown or zero-debt `currency` param and confirm the step is shown and nothing is written.
- Settle fully in one currency and confirm the other currency stays untouched and still appears in the step.
- Delete the last expense of a currency while the step is open and confirm the empty/fallback state.
- Check back navigation in both directions and the notification entry point that opens a settlement detail.
- Check light/dark, Spanish/English and screen reader labels on the rows.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-042 friend detail with per-currency balances (delivered; entry point and debt source)
- TICKET-046 1:1 settlement with direct application (delivered; direction, bound and form)
- TICKET-062 editable settlement amount (renders inside the form after this step)
- TICKET-010 group settlement (must reuse this step)
