# Editable settlement amount with live remaining debt (TICKET-062)

**Date:** 21/11/2026  
**Ticket:** `[DONE] TICKET-062-SETTLEMENT-AMOUNT-SECTION.md`  
**Related:** TICKET-046 (1:1 settlement and amount lock), TICKET-064 (debt-selection step), TICKET-010 (group settlement)

## Context

The settlement form asked **Toda la deuda** or **Parte de la deuda** before any
input. In total mode the amount was prefilled and read-only, and the form
validation short-circuited for that mode. Both paths were UI-only: `mode` never
reached `settlements/{settlementId}`.

The requested behaviour: one editable **Importe a liquidar** section that opens
with the full outstanding debt of the selected currency and states, live, how
much is left.

## Decisions

- **One amount section.** The mode chips component and every `mode`,
  `selectSettlementMode` and `changeMode` path were deleted, including the
  `SettlementAmountMode` type and the unused `currentNetCents` parameter of
  `createSettlementEditFormValues`. The amount is always editable except under
  the TICKET-046 lock.
- **Helper contract.** `getSettlementAmountState(amountText, debtCents)` returns
  `{ status: "remaining" | "settled" | "exceeds", remainingCents }` or `null`.
  The parse goes through `amountToCents`, so the message and the submission path
  cannot disagree; empty, blank, unparseable and zero amounts and a non-finite
  debt return `null`; cents are rounded to integers and the remaining amount is
  never negative.
- **Error precedence.** `exceeds` renders no helper: `AMOUNT_EXCEEDS_DEBT`
  already shows as the field error, so the copy is never duplicated. A locked
  amount shows `form.amountLocked` with no live line.
- **Validation.** `getSettlementAmountIssue` no longer bypasses validation in
  total mode: empty → `AMOUNT_REQUIRED`, zero/unparseable → `AMOUNT_INVALID`,
  above the debt → `AMOUNT_EXCEEDS_DEBT`, in create and edit.
  `settlement-form-body.tsx` counts `form.amountIssue` as a field error, so the
  amber `form.validationSummary` notice appears whenever the live amount blocks
  the save.
- **Prefill and bound.** Create prefills the full debt of the first debt
  currency, edit the stored `amountCents`, and `selectSettlementCurrency` always
  prefills the full debt of the newly selected currency. The edit bound keeps
  excluding the settlement itself (`getSettlementEditableNetCents`). The
  create-screen `debtCents` fallback became `0`, so a currency that disappears
  mid-form cannot borrow another currency's bound.
- **Refresh semantics.** The total-mode re-sync effect was removed from
  `use-settlement-form-state.ts`: a debt refresh only moves the bound, while a
  refresh that changes the default currency still replaces the draft (the reset
  key is `viewerUid | friendUid | currency`).
- **Accessibility.** The shared `AmountField` gained an optional
  `helperLive?: boolean` (default `false`): Android gets
  `accessibilityRole="text"` + `accessibilityLiveRegion="polite"` and iOS a
  queued `announceForAccessibilityWithOptions(..., { queue: true })`. The
  mount/prefill value is skipped and nothing is announced while an error shows,
  so opening the form never interrupts the screen reader. Other consumers are
  unchanged.
- **Group reuse.** Guaranteed by construction: one `SettlementForm` /
  `SettlementFormMainFields` amount section plus the pure helper; TICKET-010
  must consume it instead of building a second amount flow.

## Files changed

- **Feature utils:** new `features/settlements/utils/settlement-amount-status.ts`
  (+ colocated test); updates to `settlement-form.types.ts`,
  `settlement-form-values.ts`, `settlement-form-input.ts`, `settlement-form.ts`
  and `utils/__tests__/settlement-form.test.ts`.
- **Feature hooks:** `use-settlement-form.ts`,
  `settlement-form-controller.types.ts` and `use-settlement-form-state.ts`
  (mode removal and refresh comment).
- **Feature components:** deleted `settlement-form-mode-chips.tsx`; updated
  `settlement-form-main-fields.tsx`, `settlement-form-body.tsx` and
  `settlement-create-screen.tsx`.
- **Shared UI:** `shared/components/molecules/amount-field.tsx` (`helperLive`).
- **Copy and styles:** `features/settlements/locales/{es,en}.json`;
  `features/settlements/styles/settlements.styles.ts` (dead `debtAmount` and
  `textInput` keys removed).
- **Docs:** this ticket and note, roadmap, `README.md`, `project-memory.md`,
  `component-inventory.md`.

No schema, document, service, repository, ledger, rules or index change.

## Verification (21/11/2026)

- `npx tsc --noEmit` pass.
- `npx expo lint` pass.
- `npx jest`: 330 suites / 2026 tests pass.
- `npm run test:coverage`: gate intact, 98.92 % statements, 94.69 % branches,
  98.57 % functions, 99.5 % lines; the new helper at 100 %.
- `npm run check:copy`: 307 TSX files.

## Review

Independent `reviewer`: verdict `approve with nits`. Fixed before closing: the
missing `form.amountIssue` in the validation notice, the iOS mount/interrupting
announcement (now skipped on mount and queued), the create-screen `debtCents`
fallback, the `use-settlement-form-state` doc comment, the dead styles and two
test gaps.

## Deferred and pending

- Extract a standalone `SettlementAmountSection` when TICKET-010 starts; this
  ticket asked for the section inside `settlement-form-main-fields.tsx`.
- A server `fieldErrors.amount` still takes precedence after the user edits a
  rejected save. Pre-existing and unchanged, kept as a known edge.
- Manual device and screen-reader validation (iOS VoiceOver + Android TalkBack),
  light/dark and es/en remain pending.
