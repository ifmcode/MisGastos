# Offline-first prerequisites: client ids, revision and soft delete (TICKET-023, slice 2)

> Date: 24/11/2026
> Status: Delivered — prerequisites 1-2. TICKET-023 stays `🚧 In progress`.
> Related: `roadmap.md` Phase 7, `tickets/[DONE] TICKET-023-FUTURE-OFFLINE-FIRST-SYNC.md`,
> the accepted ADR [`2026-11-14-offline-first-architecture.md`](2026-11-14-offline-first-architecture.md),
> the previous slice [`2026-11-24-offline-local-db-foundations.md`](2026-11-24-offline-local-db-foundations.md),
> `guidelines/security-and-validation.md`, `testing/test-guide.md`

## Context

Slice 1 delivered the local SQLite base (`shared/lib/local-db/`). This slice
implements ADR §11 prerequisites 1 and 2, agreed with the user:

1. Client-generated ids for wallets, transactions, transfers and categories.
2. `revision`, `updatedAt` discipline, soft delete for transactions and the
   `appliedMutations` collection with the rules that enforce them.

No epic requirement or acceptance criterion is closed by it: the read cache,
the write queue, the sync engine, conflicts, offline social and the offline UX
are still pending.

## Delivered

### 1. Revision contract

- New `shared/utils/revision.ts`: `INITIAL_REVISION = 0`,
  `readStoredRevision` (missing, non-integer or negative → 0) and
  `nextRevision`. Pure: no clock, no Firebase.
- `revision: number` (required) on `Wallet`, `Transaction`, `Transfer` and
  `Category`; the four mappers read it with the legacy default 0. `BaseEntity`
  is untouched because friends, groups and notifications are not revisioned.
- A create writes 0 and every update writes the stored value plus one, in the
  same write that touches `updatedAt`. Every write path was audited: personal
  operations, linked-movement creation/edit/soft-delete (shared expense, group
  expense, settlement, group settlement), wallet reassignment/orphan, category
  reorder/seeding and the wallet balance updates made as a side effect of money
  operations.

### 2. Client ids

- `id?: string` on `CreateWalletDto`, `CreateCategoryDto`,
  `CreateTransactionDto` and `CreateTransferDto`; `readClientDocumentId`
  (`shared/utils/client-id.ts`) trims and ignores a blank value.
- A provided id writes that document; without one the existing generated
  reference is kept. Transactions and transfers already generated their
  reference client-side; now the caller can fix it before the local write, which
  is what the outbox needs in Phase 4.

### 3. Transactions move to soft delete

- `deleteTransactionOperation` writes `deletedAt`, `updatedAt` and
  `revision + 1`, reverts the signed amount exactly once and is idempotent: an
  already deleted movement returns without touching the wallet. Orphaned
  movements (`walletId: "-1"`) are stamped without a wallet write.
- A movement linked to a shared expense, group expense, settlement or group
  settlement is rejected with `TRANSACTION_INVALID`, because only its owning
  operation may revert and close it.
- Editing a soft-deleted movement is rejected with `TRANSACTION_NOT_FOUND`; its
  amount was already reverted, so applying it again would leave a balance that
  no visible record explains.
- The movements list already filtered `deletedAt`; no history/UI change was
  needed.

### 4. Rules (`firestore.rules`)

- `isRevisionBump(stored, next)`: `next` is an int ≥ 1 and equals the stored
  value plus one; a legacy, malformed or negative stored value counts as 0 and
  its first update writes 1, so a damaged document stays recoverable.
- `isInitialRevision`: a create may omit `revision` (legacy bridges) but cannot
  claim a base other than 0.
- Both apply to `wallets`, `transactions`, `transfers` and `categories`.
- `transactions` hard delete is denied (`allow delete: if false`): a delete is
  a soft delete, and a physical delete would drop the document whose balance was
  reverted.
- New owner-only, append-only `appliedMutations/{ownerId}__{clientMutationId}`
  (`ownerId`, `clientMutationId`, `entityType`, `entityId`, `revisionAfter`,
  `appliedAt`). A `get` on a missing marker resolves as not-found (same
  existence-oracle pattern as `friendRequests`), and the document is never
  updated or deleted. The sync executor writes the marker in Phase 5; this slice
  is rules and contract only.

### 5. Consequences of the soft delete

- `wallet-movements.ts` keeps soft-deleted movements as documents (so a wallet
  deletion still re-points them) but excludes them from the usage count and from
  the reassignment net; counting them would re-apply an amount that was already
  reverted.
- `category-usage.ts` counts only active movements, so a soft-deleted movement
  no longer blocks deleting its category.
- A wallet whose only movements are soft-deleted is delegated to the orphan
  batch without asking for a reassignment target, matching the usage guard.

### 6. Splits to respect the 150-line limit

`transaction-update.wallets.ts`, `transaction-stored.utils.ts`,
`transaction-delete.result.ts`, `transaction-link-readers.ts`,
`transfer-update.balances.ts`, and the category repository split into
`category-write.operations.ts`, `category-seed.operations.ts` and
`category-usage.ts`.

## Decisions

| Decision | Reason |
|---|---|
| Create writes revision 0 and updates write stored+1; legacy = 0 | Matches the local SQLite `revision DEFAULT 0` and lets existing documents be edited after the deploy without a blocking backfill. |
| `appliedMutations` rules only in this slice | The marker is written by the sync executor (Phase 5); adding `clientMutationId` plumbing now would be dead code. |
| Linked movements cannot be deleted by the personal flow | Their owner operation reverts and closes them; a second revert would corrupt the wallet. |
| Editing a soft-deleted movement is rejected | The amount is already reverted; a personal edit would silently re-apply money. |
| Rules deny the hard delete of transactions | Guarantees the soft-delete invariant even for a hand-crafted client write. |
| Optional client id instead of a mandatory one | No caller changes today; Phase 4 can pass the local id without a second API change. |
| Negative/malformed stored revision → 1 | A damaged document must stay editable instead of being locked out by the rules. |

## Review findings and fixes

The slice went through a read-only `reviewer` pass that returned **changes
requested**. Fixed before closing:

- **Blocker:** a personal edit of a soft-deleted movement re-applied its amount
  while keeping `deletedAt`; now rejected with `TRANSACTION_NOT_FOUND`.
- **Major:** the wallet delete operation decided "has movements" from raw
  documents while the usage guard counted only active ones; both now agree and a
  soft-deleted-only wallet is orphaned without a target.
- **Major:** `isRevisionBump` locked a document with a negative stored revision
  (the client writes 1, the rule demanded stored+1); the rule now treats any
  invalid value as 0.
- **Major:** the update operation returned a revision from an outer variable;
  the returned entity is now the one built when the write happens.
- Nits: the category reorder skips stale ids instead of writing a guessed
  revision, and `deleteTransactionOperation` computes the revision after the
  idempotent return.

## Deviations from the ADR

1. **No legacy backfill script.** Mappers treat a missing `revision` as 0 and the
   first update writes 1, so the deploy does not depend on a script. A bulk
   backfill remains optional for the sync phase.
2. **`appliedMutations` is contract + rules only.** ADR §5.2 also describes the
   marker write inside every operation; that lands with the executor in Phase 5
   (the user's decision for this slice).
3. **Creates may omit `revision`.** `isInitialRevision` accepts a legacy create
   without the field, while the new client always writes 0; the strict
   requirement applies from the first update onwards.
4. **`transactions` delete is fully denied**, including unlinked movements (ADR
   said `deletedAt` becomes updateable). There are no released clients that
   depend on the physical delete.

## Deliberately out of scope

Local read cache and offline banner (phase 3), the offline write queue and local
balance derivation (phase 4), the sync engine, backoff, exactly-once markers and
the conflict UI (phase 5), offline social (phase 6) and the offline UX,
observability, account purge and web decision (phase 7). Also out:
`clientMutationId` plumbing, the legacy backfill script, local feature
repositories and the `offline_first` feature flag.

## Known debt

- `transaction-update.operation.ts` dropped from 178 to 142 lines after the
  wallet-adjustment extraction; `transaction-firestore.utils.ts` dropped to 118
  after the link readers moved out. No over-limit file is left in this slice.
- The `appliedMutations` marker is not yet tied to the document it protects;
  when the executor lands it should validate `revisionAfter` against the written
  document, which may need a small rules change.

## Verification (24/11/2026)

- `npx tsc --noEmit`, `npx expo lint`: clean.
- `npx jest`: **401 suites / 2687 tests**.
- `npm run test:coverage`: **98.94 % statements, 95.01 % branches, 98.74 %
  functions, 99.53 % lines**; the new `shared/utils` modules at 100 %.
- `npm run check:copy`: passed (343 TSX files).
- `npx firebase deploy --only firestore:rules --dry-run`: compiles, nothing
  published.

## Pending manual steps

- Deploy the rules with `npm run firebase-deploy:rules` before exercising wallet
  create/edit/archive, movement create/edit/delete, transfer edit/delete,
  category edit/reorder and a wallet deletion with reassignment.
- Manual device validation of those flows, including a deleted movement missing
  from the history and detail.
- No new composite index: `appliedMutations` is addressed by deterministic id.
