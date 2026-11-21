# Group expenses (21/11/2026)

## Context
TICKET-009 closed its 1:1 subset on 15/11/2026 and stayed open for the group
requirements. This session implemented them: group membership and payer
validation, participant selection, per-expense currency, the owner/creator/payer
permission model, the expense list in the group detail, a read-only detail route
and the four split modes in the group form. Balances, settlements and history
stay in TICKET-010/011, and the membership lifecycle in TICKET-068.

## Data model
- New feature `features/group-expenses/`.
- Root collection `groupExpenses/{expenseId}`, client-generated id, with a
  `groupId` field. The list is a single `where('groupId', '==', groupId)` plus a
  client-side sort, so no composite index is needed.
- A `groups/{groupId}/expenses` subcollection was rejected: it would save the
  group read in the rules but make a cross-group query impossible without a
  collection-group index.
- Document: `groupId`, `payerId`, `amountCents`, `currency`, `splitMode`,
  `participants[{ userId, shareCents, percentageBps?, weight? }]`, `description`,
  `date`, `createdBy`, `createdAt`, `updatedAt`, `deletedAt`.
- No wallet, category or linked movement: group expenses never touch personal
  balances. The currency is stored per expense; `group.defaultCurrency` is only
  the initial form value and never a conversion source.
- `group-expenses.mapper.ts` drops malformed documents. Updates only write the
  mutable fields; the soft delete writes `deletedAt` + `updatedAt`.

## Split and participants
- The 1:1 split engine is reused: `splitExpenseAmount`, `distributeByRemainder`
  and the split schemas, in integer cents.
- `splitExpenseAmount` and `normalizeParticipants` gained an explicit
  `minParticipants` option, default **2**, so the 1:1 contract is untouched. The
  group schema passes **1** because the payer may be excluded and a two-member
  group can charge a single participant.
- All active members are selected by default; **Todos** selects or clears all;
  only selected members appear in the split inputs and receive a share; equal
  divides among the selected.
- The payer must be an active member and may be absent from `participants`
  (pays for others) with a 0 share; the full amount is credited implicitly and a
  0 share creates no debt.
- At least one participant is required.

## Permissions and the former-members edge
- Any active member creates.
- The owner, the creator (`createdBy`) or the payer edits and soft-deletes; every
  other member is read-only.
- `groupId`, `createdBy` and `createdAt` are immutable. A soft-deleted record is
  never edited nor resurrected; delete is idempotent and hard delete is denied.
- TICKET-068 owns the balance-safe membership lifecycle, but the owner can
  already remove a member today. An expense whose stored payer or participants
  are no longer members is therefore **read-only**
  (`EXPENSE_HAS_FORMER_MEMBERS`) and can still be soft-deleted by an editor. The
  detail shows a warning; the edit action is hidden. This prevents a smaller
  participant set from silently moving debt.

## Ledger seam for TICKET-010
- `buildGroupExpenseLedgerEntries` emits one row per active non-payer
  participant with a positive share: `fromUserId` owes `toUserId = payerId`.
- `getGroupExpenseViewerShare` returns the cents the viewer owes (0 when the
  viewer is the payer or has no row) for the list row.
- Net balances, the zero-sum invariant, simplification and settlements are
  TICKET-010.

## UI and routes
- Group detail: expenses section with title and count, loading, error with retry,
  empty state, active expenses newest first and pull-to-refresh.
- Row: date gutter, description, «<payer> pagó <total>» and «Tu parte» when the
  viewer owes a share; the row only navigates.
- The **+** FAB opens the page sheet with the group locked and the already
  loaded members.
- The hardcoded «En paz» line is hidden while the group has expenses.
  TICKET-010 replaces it with the real per-currency balances.
- Form: group field (picker when the entry point is Movements, locked from the
  group detail or an edit), description, amount, currency, date, participant
  multi-select, payer chips and the four split modes with their helpers. A group
  picked in Movements loads its members once; the group/expense details reuse
  the members they already loaded.
- Movements FAB: **Gasto de grupo** is enabled and opens a group picker first. It
  is disabled with a **Social** hint when there are no groups and stays neutral
  while loading or after an error; the old **Próximamente** hint is gone.
- `/social/group-expenses/[expenseId]`: read-only `DetailView` with summary,
  group/payer/split/date/participant-count fields, the participant shares (viewer
  first, payer labelled), missing state, delete confirmation and back navigation
  to the group. Edit/delete only for the owner/creator/payer; `DetailView` gained
  per-action `showEdit`/`showDelete` and its defaults keep movements and
  transfers unchanged.
- Copy lives in the `groupExpenses` es/en namespace, registered in
  `shared/i18n/resources.ts`.

## Firestore rules
- `groupExpenses` `get`/`list`: active member of the expense group, proven with
  one group `get()` (Firestore caches it per request, same precedent as
  `groupJoinRequests`).
- `create`: signed in, `createdBy == auth.uid`, caller and payer in
  `memberIds`, bounded money/mode/description/date, 1..20 participants, the exact
  field list and `deletedAt: null`.
- `update`: owner, creator or payer; `groupId`/`createdBy`/`createdAt` frozen;
  either the exact soft-delete diff or the mutable-field diff; a deleted record
  cannot be resurrected.
- `delete: if false`.
- Rules cannot iterate a list, so per-row participant membership, uniqueness and
  the shares-sum invariant stay in the schema and the service. Only the list
  shape and its first row are checked in the rules.
- The rules are **not deployed**: `npm run firebase-deploy:rules`.

## Verification
- `npx tsc --noEmit` clean, `npx expo lint` clean.
- `npx jest`: 329 suites / 2015 tests.
- `npm run test:coverage`: 98.92 % statements, 94.66 % branches, 98.64 %
  functions, 99.5 % lines (gate 90 %).
- `npm run check:copy`: 308 TSX files.
- `npx firebase deploy --only firestore:rules --dry-run`: compiles.

## Pending
- Deploy the `groupExpenses` rules.
- Device and dark-mode visual validation of the page sheet, the group picker,
  the section rows and the detail route.
- TICKET-010 (net balances, simplification, settlements), TICKET-011 (history)
  and TICKET-068 (membership lifecycle).
