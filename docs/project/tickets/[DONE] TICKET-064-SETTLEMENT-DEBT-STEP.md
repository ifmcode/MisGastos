# [DONE] TICKET-064 - Settlement Debt Selection Step for Multiple Currencies

**Type:** UX  
**Priority:** High  
**Status:** ✅ Done (22/11/2026)  
**Related:** TICKET-042, TICKET-046, TICKET-062, TICKET-010  
**Sprint:** Post-MVP / Phase 6.0

## Description
When two people owe each other in more than one currency, `/social/settlements/new` currently jumps into the form with the first currency preselected and a currency chip row on top. Insert a step before the form that lists every currency with its outstanding debt and direction; tapping one opens the settlement form locked to that currency. When only one currency has debt, the step never appears and the form opens directly.

## Requirements
- [x] Add a debt-selection step that lists one row per currency with a real debt: currency code and symbol, outstanding amount, direction (**Yo pago** / **Me paga**) and a chevron
- [x] Show the step from `/social/settlements/new?friendUid=…` only when the pair has two or more debt currencies
- [x] Open the form from the selected row through the same route with a `currency=<code>` param, pushing (not replacing) so back returns to the step and the step's back returns to the friend detail
- [x] Skip the step and open the form directly when exactly one currency has debt
- [x] Remove `components/settlement-form-currency-chips.tsx`, `utils/settlement-form-values.ts#selectSettlementCurrency` and the currency block from `components/settlement-form-main-fields.tsx`
- [x] Pass the chosen currency into `createSettlementFormValues` instead of reading the first option, and keep the currency immutable inside the form
- [x] Fall back to the step on create when the `currency` param is missing, unknown or has no debt; never settle a silently defaulted currency. The edit route keeps the stored currency and never shows the step
- [x] Reuse the existing loading, error, missing and empty states of `SettlementCreateScreen` and add step-specific empty copy when the debt disappears while the step is open
- [x] Add `form.debtStep.*` copy to `features/settlements/locales/{es,en}.json`: title, subtitle with the friend name, row accessibility label, list accessibility label and the empty message
- [x] Add tests for the step/form decision (0, 1 and 2+ options) and for resolving the `currency` param; keep the direction and amount bound tests untouched
- [x] No schema, document, rules or ledger change: the chosen currency already exists in `settlements/{settlementId}`

## Acceptance Criteria
- [x] With two debt currencies the user chooses which debt to settle before seeing the amount
- [x] The form opens in the chosen currency, prefilled with that currency's debt, and offers no way to switch currency inside it
- [x] With a single debt currency the step is skipped
- [x] A currency without debt is never offered and a forged `currency` param falls back to the step
- [x] Back from the form returns to the step; back from the step returns to the friend detail
- [x] Both rows show the correct direction and amount, grouped per currency with no conversion
- [x] Edit shows no step and keeps the stored currency
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Implemented

Delivered and verified on 22/11/2026. Session note:
[`session-notes/2026-11-22-settlement-debt-step.md`](../development-notes/session-notes/2026-11-22-settlement-debt-step.md).

### Debt step
- New pure `resolveSettlementDebtStep(options, currencyParam, { stepShown })` (`utils/settlement-debt-step.ts`): a valid param opens that currency; a non-empty param without a match never opens another currency (it asks while debt remains and reports empty otherwise); no debt returns `empty`; a step already shown is never skipped again, so a pair that drops to one currency keeps asking; the single-currency skip only applies on the first render. It never reads `options[0]` blindly and is covered at 100 %.
- `useSettlementDebtSelection` owns the decision, the selected option, `debtDisappeared` (the step was shown and the pair no longer owes anything) and `selectCurrency`, which pushes `/social/settlements/new?friendUid=…&currency=<code>` and ignores a second tap until the step regains focus. `useSettlementCreateScreen` composes it with the friend overview, wallets, categories and write state, and exposes the new `select` status, `selectedOption`, `selectCurrency` and `debtDisappeared`.
- `app/social/settlements/new.tsx` normalizes `friendUid` with `trim()` and the optional `currency` with `trim().toUpperCase()`, and passes both to the screen. The friend-detail entry point, `PRIVATE_SEGMENTS` and the route registration are unchanged.
- `SettlementCreateScreen` renders `SettlementDebtStep` on `select`, the form with `selectedOption.debtCents` and `viewerIsCreditorFor(selectedOption)` on `ready`, and delegates the remaining states to `SettlementCreateState`. When `debtDisappeared` is true the empty title becomes `form.debtStep.empty` and the message becomes `form.debtStep.emptyMessage`.
- `SettlementDebtStep` (header plus a scrollable list labelled with `form.debtStep.listAccessibility`) and `SettlementDebtOption` (currency code+symbol, formatted outstanding amount, **Yo pago**/**Me paga** in danger/success and a chevron; button role and a `form.debtStep.rowAccessibility` label that includes the direction) are the new molecules.
- Copy `form.debtStep.{title,subtitle,rowAccessibility,listAccessibility,empty,emptyMessage}` added to both locales; `form.currencyLabel` and `form.currencyAccessibility` removed.

### Immutable currency
- `createSettlementFormValues` now takes `currency: CurrencyCode` and returns `null` when that currency has no debt; it no longer reads the first option. The controller only builds defaults for the resolved option.
- Deleted `settlement-form-currency-chips.tsx`, `selectSettlementCurrency`, `changeCurrency` (controller type, hook and form) and the currency block of `settlement-form-body.tsx` (the ticket named `settlement-form-main-fields.tsx`, where the block no longer lived). `SettlementForm` keeps `options` only as the source of the bound and direction; the edit modal still passes its single stored option and shows no step.
- The form debt card shows the currency label (`EUR €`) because the selector is gone, and `getSettlementCurrencyOptions` normalizes with `toCents` before filtering, so a `NaN`/`Infinity` balance cannot become a `0,00` row.
- No schema, document, service, repository, rules or ledger change.

### Tests and verification
- `utils/__tests__/settlement-debt-step.test.ts`: 0 options, 1 option with a valid/unknown param and with/without `stepShown`, 2+ with a valid param and 2+ with a missing/unknown/debt-free param.
- `utils/__tests__/settlement-form.test.ts`: `currency` added to every `createSettlementFormValues` call, new `null` cases for a debt-free and a missing currency, a `NaN`/`±Infinity` options case and the currency-change tests removed; direction, amount-bound, date and wallet tests untouched.
- `npx tsc --noEmit` pass, `npx expo lint` pass, `npx jest` 332 suites / 2040 tests pass, `npm run test:coverage` 98.92 % statements / 94.79 % branches / 98.5 % functions / 99.5 % lines (gate intact, decision and currency helpers at 100 %) and `npm run check:copy` 309 TSX files.
- Independent `reviewer`: first verdict `changes requested`; fixed the silent currency switch under a non-empty param, the step auto-promotion after saving, the empty copy that duplicated `missingTitle`, the direction missing from the row label, the `NaN` option, the lowercase param and the missing currency label in the form.
- Pending manual validation: two-currency pair (each row opens its own debt), single-currency skip, forged/missing/zero-debt param, settling one currency keeps the other in the step, the debt disappearing while the step is open, both back directions, edit keeps the stored currency, light/dark, Spanish/English and screen reader.

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
