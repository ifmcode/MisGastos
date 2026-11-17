# Shared-expense save feedback, category picker and mandatory category

> Covers TICKET-049 (link feedback and category reset), TICKET-050 (save
> feedback and category picker) and TICKET-051 (mandatory category and no hidden
> default). Delivered 17/11/2026, Phase 5.1.
> Tickets: [`[DONE] TICKET-049-SHARED-EXPENSE-LINK-FEEDBACK.md`](../tickets/%5BDONE%5D%20TICKET-049-SHARED-EXPENSE-LINK-FEEDBACK.md),
> [`[DONE] TICKET-050-SHARED-EXPENSE-SAVE-FEEDBACK.md`](../tickets/%5BDONE%5D%20TICKET-050-SHARED-EXPENSE-SAVE-FEEDBACK.md),
> [`[DONE] TICKET-051-MANDATORY-SHARED-EXPENSE-CATEGORY.md`](../tickets/%5BDONE%5D%20TICKET-051-MANDATORY-SHARED-EXPENSE-CATEGORY.md)

## Context

TICKET-048 made the wallet mandatory for viewer-paid shared expenses but kept
defaulting the linked category to the system **Gastos compartidos** category.
TICKET-049 fixed the missing-wallet case: `fromSharedExpense` trims `walletId`,
forces `categoryId: ""` and `toSharedExpenseInput` never sends a category without
a wallet, so a stale system category cannot survive there.

Two gaps remained, and a screenshot showed both at once with a wallet selected:
the picker still offered and preselected **Gastos compartidos**, and a
service-side rejection (wallet currency, insufficient balance, missing wallet,
permission) was only painted in the `ErrorBanner` at the top of the sheet, which
scrolls out of view. Pressing **Guardar** looked like a no-op because the notice
next to the button never changed.

## Decisions

1. **The system category is never offered.** `getSharedExpenseCategoryOptions`
   filters the deterministic id `getSharedExpenseCategoryId(viewerUid)` out of
   the options, and passes an empty selection to `withSelectedFallback` when the
   stored id is that category, so it is not restored as a fallback row either.
   The movement is already the shared expense; the category adds no choice.
2. **Nothing preselects it.** `selectSharedExpenseWallet` keeps a real category
   the user picked and clears a legacy default instead of defaulting it.
   `fromSharedExpense` clears a stored shared default on load, so the field opens
   deselected.
3. **The blocking error is visible where the finger is.**
   `shared-expense-form-body.tsx` renders `error ?? tr(errors.<firstField>)` as an
   `accessibilityRole="alert"` notice immediately above `FormActions`. The top
   `ErrorBanner` and the inline field errors stay as they were.
4. **Wallet currency is checked before the request.** The pure
   `getSharedExpenseWalletCurrencyError` returns `CURRENCY_MISMATCH` when the
   selected wallet's currency differs from the expense;
   `useSharedExpenseForm.submit` maps it to the `walletId` field error and
   returns without calling `onSubmit`, so no write happens. A missing or
   orphaned wallet returns `null` and stays a service concern.
5. **`ErrorBanner` announces.** It keeps `accessibilityRole="alert"` plus a
   polite live region, so both the top banner and the new notice are announced.

Files: `utils/shared-expense-link-options.ts`,
`utils/shared-expense-link-values.ts`, `utils/shared-expense-form-load.ts`,
`hooks/use-shared-expense-form.ts`, `components/shared-expense-form-body.tsx`,
`schemas/shared-expense-validation.types.ts` (only the code union gains
`CURRENCY_MISMATCH`).

## Accepted trade-offs

- The service may still ensure the internal **Gastos compartidos** category when
  the form sends none, so the movement keeps a valid category without the picker
  showing it. The invariant lives in the service, not in the UI.
  *(Superseded by TICKET-051: the service now rejects a linked movement without a
  category and no default is created or applied.)*
- Hiding the category does not bypass the real business rejections. A wallet in
  another currency, an insufficient balance or a missing wallet still blocks the
  save; the change only makes the reason visible next to **Guardar**. The
  original screenshot now shows the actual service message instead of silence.
- Duplicated validation: the form and the service both check the wallet
  currency. This is intentional — the form gives immediate feedback, the service
  stays authoritative.

## Verification

- `npx tsc --noEmit` clean, `npx expo lint` clean.
- `npx jest`: 212 suites / 1200 tests passed.
- `npm run test:coverage`: 99.08% statements, 94.86% branches, 99.02% functions,
  99.50% lines.
- `npm run check:copy`: 222 TSX files.
- No schema, service, repository, money, rules, route or Firestore change; no
  deploy and no migration.

## Known limitations

- Manual device validation was **not** performed: the picker exclusion, the
  wallet-currency message and the error next to **Guardar** are covered by unit
  tests only.
- The system category can still be reused by the service for a movement created
  without a category; it simply has no UI entry point in this picker.
  *(Superseded by TICKET-051: a linked movement without a category is rejected.)*

## TICKET-051 follow-up

The accepted trade-off above did not survive: keeping the service free to create
the hidden category produced the same gap one layer down. A viewer-paid linked
expense sent without a category was either saved under a category the user never
saw or failed with a `permission-denied` while creating it, and the UI had no way
to explain either outcome.

- **No hidden default.** `resolveCategoryId`
  (`services/shared-expense-write.ts`) returns `null` only for a social-only
  expense and throws `CATEGORY_REQUIRED` when a wallet is linked and no category
  arrived. Nothing is created or ensured behind the save.
- **The category is required and explicit.** `schemas/shared-expense-wallet-validation.ts`
  pushes `{ field: "categoryId", code: "CATEGORY_REQUIRED" }` for the same case,
  and `CATEGORY_REQUIRED` joined the schema/service code unions. The form blocks
  the save before any Firestore write; `SharedExpenseCategoryField` renders the
  translated `errors.CATEGORY_REQUIRED` under the field, and the existing alert
  notice above **FormActions** repeats it next to **Guardar**.
- **The creation helper is gone.** `ensureSharedExpenseCategory`,
  `SHARED_EXPENSE_CATEGORY` and the public service method were removed.
  `services/shared-expense-category.ts` keeps only `SHARED_EXPENSE_CATEGORY_ID`
  and `getSharedExpenseCategoryId`, still used to filter the legacy system
  category out of the picker and to clear a stored id.
- **Social-only is unchanged.** A friend-paid expense with no wallet keeps
  `categoryId: null` and no linked movement.
- **Legacy data.** No category or movement is migrated: a linked expense stored
  before this change keeps its stored category until it is edited, and the next
  edit requires a real one.

Files: `services/shared-expense-write.ts`,
`services/shared-expense-category.ts`, `services/shared-expense.errors.ts`,
`schemas/shared-expense-wallet-validation.ts`,
`schemas/shared-expense-validation.types.ts`,
`components/shared-expense-linked-movement.tsx`,
`components/shared-expense-category-field.tsx`.

Verification: `npx tsc --noEmit` clean, `npx expo lint` clean, `npx jest`
213 suites / 1203 tests, `npm run test:coverage` 99.07% statements / 94.83%
branches / 99.02% functions / 99.50% lines, `npm run check:copy` 222 TSX files.
No Firestore rules change; no deploy and no migration. Manual device validation
is still pending.

## Post-close polish: no duplicated notice

The first version of the bottom notice repeated the inline field error, so a
missing wallet showed the same sentence twice. The shared-expense form no longer
renders the top `ErrorBanner`: a server error is shown specifically above
`FormActions` in the danger palette, while field errors keep their inline message
and the bottom notice only shows `form.validationSummary` ("Revisa los campos
marcados antes de guardar." / "Check the highlighted fields before saving.") as an
amber warning banner (`warning`/`warningSurface`/`warningText` added to the shared
theme tokens). One specific message per place, one visible reminder next to the
button, and a tone that reads as a notice instead of an error.
