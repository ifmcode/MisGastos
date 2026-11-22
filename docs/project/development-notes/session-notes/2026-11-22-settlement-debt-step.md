# Settlement debt-selection step (TICKET-064)

**Date:** 22/11/2026
**Ticket:** TICKET-064 - settlement debt-selection step for multiple currencies
**Phase:** 6.0 - settlement and form polish

## Context

`/social/settlements/new?friendUid=…` opened the 1:1 settlement form directly and
preselected the first debt currency from `Friend.balances` (EUR first). A currency
chip row inside the form allowed switching, so a pair with EUR and USD debt reached
the amount field before deciding which currency was being settled. TICKET-062 had
already made the amount editable with a live remaining debt, which only makes sense
once the currency is fixed.

## Decision

Resolve the create route before rendering the form:

- A `currency` route param that matches a currency with debt opens the form locked
  to that currency.
- A non-empty param without a match never opens another currency: it shows the step
  while any debt remains and the empty state when none does.
- On the first render with no param, exactly one debt currency skips the step and
  opens the form directly in it.
- No debt currency shows the existing empty state.
- Two or more currencies with a missing param show a selection step with one row per
  currency.
- Once the step was shown on a screen instance it is never skipped again, so a pair
  that drops to a single currency keeps asking instead of switching the open form.

The decision is a pure function, `resolveSettlementDebtStep(options, currencyParam,
{ stepShown })` in `features/settlements/utils/settlement-debt-step.ts`, so it is
testable without a renderer and TICKET-010 can reuse it with a group balance source.

## Implementation

- `useSettlementDebtSelection` computes the decision with the `stepShown` flag,
  exposes the `selectedOption`, remembers whether the step was shown
  (`debtDisappeared` when the debt later vanishes) and pushes the same route with
  `currency=<code>`. `router.push` is deliberate: back from the form returns to the
  step and back from the step returns to the friend detail. A `pushingRef` ignores a
  double tap until the step regains focus.
- `useSettlementCreateScreen` gained the `select` status and composes the decision
  with the friend overview, wallets, categories and write state. `initialValues` is
  built only for the resolved option.
- `createSettlementFormValues` now requires the chosen `currency` and returns `null`
  when that currency has no debt, so no path falls back to `options[0]`.
- `SettlementCreateScreen` renders `SettlementDebtStep` (header + labelled list),
  `SettlementDebtOption` rows (currency code+symbol, formatted amount, direction and
  chevron, with the direction included in the accessibility label) or the existing
  form. The loading/error/missing/empty block moved to `SettlementCreateState`;
  `debtDisappeared` switches the empty title and message to
  `form.debtStep.empty`/`form.debtStep.emptyMessage`.
- The route uppercases the `currency` param; `getSettlementCurrencyOptions`
  normalizes balances with `toCents` before filtering, so a `NaN`/`Infinity` cannot
  create a `0,00` row, and the form debt card shows the currency label because the
  selector is gone.
- Removed the currency selector from the settlement form
  (`settlement-form-currency-chips.tsx`, `selectSettlementCurrency`,
  `changeCurrency`) and the `form.currencyLabel`/`form.currencyAccessibility` copy.
  The edit modal already passed a single stored option, so it keeps its currency and
  never shows the step.
- No schema, document, repository, service, rules or ledger change: the chosen
  currency was already stored in `settlements/{settlementId}`.

## Alternatives considered

- **Keep the chips and ask first only with 2+ currencies.** Rejected: the form would
  still offer switching and the first currency would still be silently defaulted.
- **A modal step over the form.** Rejected: the route push keeps the native back
  behaviour and the existing route contract; a modal would add state that the friend
  detail and notifications do not need.
- **Pick the first currency when the param is invalid.** Rejected: the ticket requires
  falling back to the step and never settling a silently defaulted currency. The only
  exception kept is the ticket's explicit single-currency skip.

## Consequences

- A pair with multiple currencies makes one extra tap before the amount, but the
  form and its bound are unambiguous.
- The step is the single place TICKET-010 must reuse for group currencies; only the
  balance source changes.
- A currency that disappears while the form is open never switches the form to
  another currency: a non-empty param falls back to the step (or empty), and once the
  step was shown a single remaining currency is offered instead of auto-opened.

## Validation

- `npx tsc --noEmit`, `npx expo lint`, `npx jest` (332 suites / 2040 tests),
  `npm run test:coverage` (98.92 % statements, 94.79 % branches, 98.5 % functions,
  99.5 % lines) and `npm run check:copy` (309 TSX files) pass.
- New decision tests cover 0, 1 and 2+ options, valid/missing/unknown/debt-free params
  and `stepShown`; `createSettlementFormValues` covers a debt-free and a missing
  currency and the option builder ignores `NaN`/`Infinity`.
- Independent `reviewer`: first verdict `changes requested`. Fixed the silent currency
  switch under a non-empty param, the step auto-promotion after saving (the `stepShown`
  rule), the empty copy that duplicated `missingTitle`, the missing direction in the
  row label, the `NaN` option, the lowercase param and the missing currency label in
  the form.
- Pending manual validation: two currencies on device, single-currency skip, forged
  param, partial settlement keeping the other currency, debt disappearing with the
  step open, both back directions, light/dark, Spanish/English and screen reader.

## Open questions

- None for V1. TICKET-065/066 replace the remaining wallet/category chips with single
  picker buttons; the debt step contract does not depend on them.
