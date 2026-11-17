# Session note - Mandatory wallet for viewer-paid shared expenses (TICKET-048)

**Date:** 17/11/2026  
**Ticket:** TICKET-048 (done)  
**Status:** ✅ Done (ticket file renamed with the `[DONE] ` prefix)

## Context
TICKET-044 made the wallet optional: choosing one linked the expense to a personal
movement, and choosing **Sin cartera** kept it social-only. That was the correct
shape for the data model — a friend-paid expense has no movement — but it left a
silent trap for the payer. A viewer-paid expense saved without a wallet recorded
that the viewer owed nothing to the wallet, so the spend never appeared in
**Movimientos** and the dashboard totals never followed. Nothing failed, nothing
warned, and the only trace was a social row that looked complete.

The rule "when the viewer pays, the wallet is not optional" had to live in three
places at once: the form (so the user cannot choose the broken state), the service
(so no other caller can produce it) and the rules (so a hand-written write cannot).
Legacy documents saved before the rule still had to be readable, and the two payer
transitions — the ones that create and destroy the movement — still had to end in
exactly one balance effect.

## Decision

### Layer map
- **Schema** — `schemas/shared-expense-wallet-validation.ts` (new) owns
  `readSharedExpenseLink`. It reports `{ field: "walletId", code: "WALLET_REQUIRED" }`
  when the resolved payer is the viewer and no wallet was selected, and nulls the
  category whenever the wallet is `null` (no wallet, no movement, so no category).
  The helper moved out of `shared-expense-field-validation.ts` because that file
  had passed the 150-line soft limit; it keeps its place in the display order,
  right after the payer.
- **Schema contract** — `validateSharedExpenseInput` now rejects on
  `issues.length > 0`, not only when a parsed field is `null`. The wallet issue is
  the first issue that does not null a parsed field, so the previous check would
  have returned `ok: true` with a missing wallet.
- **Service** — `assertSharedExpensePayerWallet` in
  `services/shared-expense-persist.ts` (new) throws
  `SharedExpenseOperationError("WALLET_REQUIRED")`, and
  `createSharedExpenseRecord` / `updateSharedExpenseRecord` call it **first**,
  before resolving the link or ensuring the category. This is defense in depth: the
  form already blocks, but a caller that builds a payload by hand must not reach the
  repositories. Wallet existence, ownership and currency stay inside the atomic
  transaction.
- **Rules** — `hasPayerWallet(data)` requires a non-null wallet when
  `payerId == request.auth.uid`, and it is applied to `sharedExpenses` create and
  update. Friend-paid documents keep passing with no wallet.
- **Form** — the wallet block still renders only while the viewer pays, but
  **Sin cartera** is gone, the label is no longer optional, the wallet error renders
  under the field and a currency with no active wallets shows `form.walletEmpty`
  pointing at **Carteras**. The submit fails with `WALLET_REQUIRED` in that case, so
  the expense cannot be saved without its movement. Wallet, payer and currency
  changes clear the error; clearing the wallet clears the category.

### Payer transitions
- **Friend → viewer** clears the previous wallet/category in the form, reveals the
  block, makes the wallet required, and the save runs the existing
  `updateSharedExpenseLinkOperation`: one `runTransaction` creates the movement and
  applies the wallet balance once.
- **Viewer → friend** clears wallet and category, hides the block, and the save keeps
  the link path because the expense is already linked. The movement is reverted and
  soft-deleted, `FirebaseTransactionRepository` filters `deletedAt`, and the record
  leaves **Movimientos** exactly once.
- No transaction was rewritten; the ticket adds the requirement and the UI around a
  transition TICKET-044 already shipped.

### Legacy records and the soft-delete exception
A viewer-paid expense stored with `walletId: null` still exists in production, so
the rules cannot simply require a wallet on every update. The update accepts
`isExpenseSoftDelete` (`deletedAt` was `null`, the next value is a string, and
`diff` affects only `deletedAt`/`updatedAt`) and otherwise falls back to
`hasPayerWallet`. The linked delete may also clear `linkedTransactionId`, so it goes
through `hasPayerWallet` instead — linked records always carry a wallet, so the
exception cannot be reused to skip the requirement. Any real edit still needs one.

On the UI side, `utils/shared-expense-wallet-warning.ts` (pure
`hasViewerPaidWithoutWallet`) excludes the orphaned `-1` wallet because that record
did have a movement and merely lost its wallet, and
`components/shared-expense-wallet-warning.tsx` renders the highlighted
`role="alert"` notice in the shared-expense detail. It is informational: the detail
stays readable, the pencil keeps working, and the next save asks for a wallet —
which is the migration path.

## Alternatives rejected
- **Allowing a viewer-paid expense to stay social-only (the status quo):** it is the
  bug, not a feature. A paid expense that never reaches **Movimientos** makes the
  personal totals lie, and the user has no way to notice.
- **Auto-selecting a wallet (first active one, or the last used):** it silently
  attributes a spend to a wallet the user never chose, and the wallet balance is
  money — a wrong default is worse than a required field.
- **Relying only on the form:** any future caller (a settlement flow, an import, a
  script) would bypass it. The service guard costs one function and keeps the
  invariant in the layer that owns persistence.
- **Splitting the wallet rule into a second fixed-wallet field:** a "linked wallet"
  next to the existing optional one would create two representations of the same
  link, double the mapper and leave the old field writable. One field, required only
  while the viewer pays, stays the only source.

## The `use-scoped-translation` enabler
The new copy pushed the shared-expense form over a TypeScript 6 cliff: `t` came from
the global `useTranslation()` and was then narrowed per namespace, so every call
made the compiler expand all namespaces and produced **TS2589** ("type
instantiation is excessively deep"). `shared/hooks/use-scoped-translation.ts` now
calls `useTranslation<Ns>(ns)`, binding `t` to the requested namespace(s).

Typed keys stay: `t("detail.walletMissingTitle")` still type-checks, and an invalid
key still fails `tsc`. The runtime `t` was already namespace-scoped by i18next, so
this is a type-level fix only; `tr` remains the memoized dynamic-key adapter that
the data-loading effects depend on. No consumer changed.

## Consequences
- **The invariant is stated three times, on purpose.** Schema (message), service
  (no write) and rules (no hand-written write). Each layer can explain itself, and a
  failure surfaces as `WALLET_REQUIRED` with translated copy.
- **New code, existing surface.** `WALLET_REQUIRED` joins the schema codes and the
  operation codes, so both the field error and the form banner resolve to the same
  translation instead of a sentence from the domain.
- **Error clearing is part of the UX.** A required field that keeps its error after
  the user fixes it reads as a second, unrelated failure; `use-shared-expense-form-state.ts`
  clears `walletId` on wallet, payer and currency changes.
- **Template split.** `shared-expense-form.tsx` had grown past the size limit; the
  body (fields, movement block and actions) moved to
  `shared-expense-form-body.tsx`, leaving the shell to own the page sheet and the
  field state.
- **Accepted trade-off:** a legacy viewer-paid expense cannot be edited (other than
  soft-deleted) until a wallet is chosen. That is the intended migration, and the
  detail notice explains it.
- **Accepted trade-off:** the rules hold an exception that exists only for legacy
  data. It is narrow (two keys, one direction, not already deleted) and the linked
  delete does not use it.

## Verification (17/11/2026)
- `npx tsc --noEmit` — clean
- `npx expo lint` — clean
- `npx jest` — 211 suites / 1190 tests passed
- `npm run test:coverage` business-logic gate — 99.07 % statements, 94.87 % branches,
  99.02 % functions, 99.50 % lines
- `npm run check:copy` — 222 TSX files
- No index change; `firestore.rules` changed.

New tests cover the schema rule (`shared-expense.schema.wallet.test.ts`), the
service guard on create and update plus the takeover path
(`shared-expenses.service.wallet.test.ts`, `shared-expense-helpers.test.ts`), the
legacy notice including the orphaned `-1` wallet
(`shared-expense-wallet-warning.test.ts`), and the error-code/display-order
expectations. Existing social-only fixtures now use the friend as payer, which is
the deliberate change this ticket makes.

## Known limitations
- **The rules are pending deployment** (`npm run firebase-deploy:rules`). Until they
  are published, the invariant is enforced by the schema, the service and the form
  only.
- **Manual device validation was not performed** in this session: both payer
  transitions, the empty-wallet guidance, the legacy notice, es/en and light/dark,
  and the screen-reader labels remain pending.
- A legacy viewer-paid expense without a wallet can be soft-deleted but not edited
  until a wallet is chosen.
- The rules exception for the unlinked soft delete is dead weight once no legacy
  records remain; it can be removed in a later cleanup with a data audit.

## Open questions
- **TICKET-046 settlements** must not repeat this gap: the initiator records their
  own movement immediately, so the wallet has to be required from the start instead
  of becoming mandatory in a follow-up.
- **Groups (TICKET-008 / full TICKET-009)** need the same rule per participant, with
  group currency and membership validation instead of the 1:1 pair.
- **A legacy-data audit** would tell whether the soft-delete exception can be
  dropped together with the detail notice.
