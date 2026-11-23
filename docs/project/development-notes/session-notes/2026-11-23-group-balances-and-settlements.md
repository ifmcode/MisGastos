# Group balances and settlements (TICKET-010)

> Session note for TICKET-010, implemented on 23/11/2026. Triggered by user
> feedback: debts created by group expenses were invisible in the group detail
> and in the Social group list. The ticket also closes the settlement half of the
> group MVP. Related: TICKET-009 (group expenses), TICKET-046/062/064 (1:1
> settlement model), TICKET-069 (group expense wallet link) and TICKET-011
> (group history, which takes the event feed).

## Phase A — balances

- Pure engine in `features/group-expenses/utils/group-balance*.ts`:
  `calculateGroupNetBalances`, `buildDirectGroupDebts`, `simplifyGroupDebts`,
  `calculateGroupBalances`, `getViewerGroupBalance`.
  * Net per member and currency = `sum(amountPaid) − sum(shareCents)`; the payer
    also pays its own share, so a payer excluded from the participants keeps the
    whole amount.
  * A settlement moves the net back: `fromUserId += amount` / `toUserId −= amount`
    (the payer's debt shrinks, the creditor receivable drops). The sum of nets is
    zero per currency by construction.
  * Direct debts fold both directions of each pair, including the reverse edge of
    every active settlement; simplification matches the largest debtor and
    creditor, transfers `min(debt, credit)` and uses at most `n−1` transfers.
  * Currencies are never converted or summed; EUR first, then the code.
- Read APIs: `GroupExpensesService.getGroupBalances` and
  `getGroupBalanceSummaries`. Read budget: one `groups` query plus one
  `groupExpenses` and one `groupSettlements` query per group (target ≤ 20),
  single-field filters and client-side sorts, no composite index.
- `simplifyDebts` lives on the group (default `true`; legacy missing/malformed),
  is written on create/update, validated by the schema and `firestore.rules`,
  and edited by the owner through a switch in the group edit form. Its history
  entry belongs to TICKET-011.

## Phase B — settlements

- Root `groupSettlements/{settlementId}` with a `groupId` (a deliberate deviation
  from the suggested subcollection): the creditor income is validated with one
  `getAfter` on the settlement and one `get` on the group, and the list stays one
  `where('groupId','==')` with a client-side sort.
- Pair and direction: `fromUserId` is the debtor/payer, `toUserId` the
  creditor/receiver. Only those two members can create/edit/delete. The debt
  view that can be settled is the same one the UI renders (direct or simplified),
  so a suggested A→C transfer is valid without a direct A→C expense debt.
- Amount: positive, at most the outstanding pair debt, partial/multiple allowed,
  date not in the future, note ≤ 500. On edit the stored settlement is excluded
  from the bound; if the pair re-routes or flips, the stored amount is the bound
  so note/date edits and reductions still work.
- The creditor may link one active same-currency wallet + income category as an
  ordinary `income` with an immutable `groupSettlementId` in the same
  transaction. The amount locks once the income exists, the debtor cannot delete
  while it exists, the creditor delete reverts once and clears the link, and
  repeated deletes are idempotent.
- The counterpart gets a `group-settlement` notification (created/updated/deleted)
  after the commit, best effort; it opens `/social/group-settlements/{id}`.
- `transactions` gained the income-only, immutable `groupSettlementId`; the
  movement is routed away from the personal detail in Movimientos and the
  dashboard.

## UI

- Group detail: **Saldos** (viewer nets, raw member nets, **Quién debe a quién**
  with direct/simplified caption, **Todo saldado**), **Liquidaciones** rows and
  **Liquidar** only on the debts where the viewer is one of the two.
- `/social/groups/[groupId]/settle` creates (from a debt row) or edits (with
  `settlementId`); `/social/group-settlements/[settlementId]` is the read-only
  detail with edit/delete.
- Social group rows show the viewer's net per currency, or **En paz**; the group
  header shows the real balances instead of the old placeholder.

## Decisions and accepted edges

1. Root collection instead of the suggested subcollection (rules and read budget).
2. The displayed debt view is the settleable one.
3. Only the pair members settle; the form opens from a debt row in its own route.
4. Notification after the commit, best effort (a notification failure never
   rolls back the money write).
5. The debt bound is read outside the write transaction because rules cannot sum
   a ledger; a concurrent write can only leave a stored amount above the current
   debt, never move money silently.
6. History entries for the setting and settlements are TICKET-011; TICKET-010
   ships the stored records.

## Verification

- `npx tsc --noEmit`, `npx expo lint` and `npm run check:copy` clean (335 TSX).
- `npx jest --coverage`: 366 suites / 2362 tests, coverage 99.04 % statements /
  94.87 % branches / 98.61 % functions / 99.56 % lines.
- `npx firebase deploy --only firestore:rules --dry-run --project misgastos-61e15`
  compiled successfully.
- Reviewer verdict `approve with nits`; the reversed-pair edit dead end and the
  `group-settlement` notification target were fixed, plus the debt-row key and
  the settlements error banner. The 0-cent hardening and the duplicate read on
  focus were accepted as follow-ups.

## Pending

- Deploy the rules: `npm run firebase-deploy:rules`.
- Manual device validation: multi-currency groups, partial/full settlements,
  direct vs simplified, creditor wallet link/unlink, debtor delete block, the
  `Liquidación` badge, light/dark and screen reader.
