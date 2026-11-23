# Group detail social parity (TICKET-072)

> Session note for TICKET-072, implemented on 23/11/2026. User feedback after
> TICKET-010: the group detail should read like the friend detail — one linear
> history, the edit action in the details sheet, and the debt list behind a
> **Liquidar deudas** action.

## Changes

- **Shared molecules:** the friend timeline row moved to
  `shared/components/molecules/timeline-row.tsx` (date gutter, icon tile, title,
  meta, optional right amount, pressed feedback, accessibility) and now backs
  both the friend and group timelines. The friend settle button moved to
  `shared/components/molecules/settle-button.tsx` (copy and callback as props),
  used by the friend header and the group balances.
- **Group timeline:** `buildGroupTimeline({ expenses, settlements })` drops
  soft-deleted records and sorts by `date` desc, `createdAt` desc, `key` asc.
  `GroupTimeline` replaces the separate expense and settlement sections with one
  linear list; expense rows keep payer/total/your share and settlement rows read
  **Pagaste …**, **… te pagó …** or **… pagó …**; each row opens its detail. The
  old `GroupExpensesSection`, `GroupSettlementsSection`, `GroupExpenseRow`,
  `GroupSettlementRow` and `GroupDebtsList` were deleted.
- **Balances and settle step:** the balances section keeps only the raw member
  nets (the viewer summary line was removed on follow-up feedback) and hides
  when the group is settled, leaving **En paz** in the header; the **Quién debe a
  quién** list moved to the step opened by **Liquidar deudas** (visible whenever
  the group has debts). The settle route
  with no pair returns `select`, lists every debt with the direct/simplified
  caption and pushes the same route with `currency`/`from`/`to`; only the
  viewer's pairs expose the action, the rest stay read-only.
- **Details sheet:** an owner-only **Editar grupo** button closes the sheet and
  opens the edit form (the header keeps only the invite shortcut), and the sheet
  shows
  **Deudas simplificadas: Sí/No** read from the group.

## Decisions

1. The debt list moved into the route step instead of a modal, mirroring the
   1:1 debt step and keeping back navigation simple.
2. The settle action appears whenever the group has debts, even if the viewer is
   not part of them; the step shows those rows read-only.
3. No card border in history rows; the date gutter and icon follow the friend
   timeline language.
4. No data, schema, service, rules, index or notification change; no deployment
   required.

## Verification

- `npx tsc --noEmit`, `npx expo lint` and `npm run check:copy` clean (336 TSX).
- `npx jest --coverage`: 367 suites / 2369 tests, coverage 99.04 % statements /
  94.88 % branches / 98.62 % functions / 99.56 % lines.
- `buildGroupTimeline` has its own tests (kinds, ordering, ties, soft deletes, no
  mutation); the friend timeline rendering is unchanged.
- Manual device and dark-mode validation pending.
