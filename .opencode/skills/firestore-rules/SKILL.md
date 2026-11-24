---
name: Firestore Rules and Data Contracts
description: Ownership, immutable-field and shared-data patterns for MisGastos Firestore rules, transactions and indexes. Use when adding a collection, changing a document shape, editing firestore.rules or writing a runTransaction operation.
---

# Firestore rules and data contracts

`firestore.rules` is the security source of truth; the repository layer is the
contract. Change both in the same ticket.

## Current model

| Collection | Owner field | Delete | Mutability |
|---|---|---|---|
| `users` | `uid` field (not doc id) | hard | `uid` immutable |
| `wallets` | `ownerId` | hard (archive first) | `ownerId` immutable, `revision` +1 |
| `transactions` | `ownerId` | **never** (soft `deletedAt`) | `ownerId` immutable, `revision` +1 |
| `categories` | `ownerId` | hard, blocked while used by an active movement | `ownerId`, `type` immutable, `revision` +1 |
| `transfers` | `ownerId` | **never** (soft `deletedAt`) | `ownerId`, `createdAt` immutable, `revision` +1 |
| `appliedMutations` | `ownerId` | **never** | append-only idempotency marker |

Rules helpers: `isSignedIn()` and `isWalletOwner(data)` (actually an owner check
reused by every collection). Reuse them; do not inline `request.auth.uid`
comparisons in new matches unless the helper does not fit.

## Revision contract (offline-first)

`wallets`, `transactions`, `transfers` and `categories` carry a `revision`
optimistic-concurrency counter:

- a create writes `0` (`isInitialRevision` also accepts a legacy create that
  omits the field);
- every update writes the stored value `+1` (`isRevisionBump`);
- a legacy or malformed stored value counts as `0`, so its first update writes
  `1` and a damaged document stays recoverable.

Bump the revision in the same write that touches `updatedAt`, inside the
transaction, using `nextRevision(storedData)` from
`shared/utils/revision.ts`. A write that forgets it is rejected by the rules, so
audit every update path when adding one. Transactions are never hard-deleted:
`deletedAt` + `revision + 1` is the delete, and only the owning shared/group
operation may revert and close a linked movement.

`appliedMutations/{ownerId}__{clientMutationId}` is the exactly-once marker
(`ownerId`, `clientMutationId`, `entityType`, `entityId`, `revisionAfter`,
`appliedAt`): owner-only reads/create, a `get` on a missing marker resolves as
not-found, and it is never updated or deleted. The sync executor writes it in
the same transaction as the data change (TICKET-023 Phase 5).

## Rules pattern for a new collection

```text
match /things/{thingId} {
  allow read: if isWalletOwner(resource.data);
  allow create: if isSignedIn()
    && request.resource.data.ownerId == request.auth.uid;
  allow update: if isWalletOwner(resource.data)
    && isWalletOwner(request.resource.data)
    && request.resource.data.<immutableField> == resource.data.<immutableField>;
  allow delete: if isWalletOwner(resource.data);
}
```

- Validate both the stored and the incoming document on update, otherwise an
  owner can move a record to another account.
- Financial records are never hard-deleted once they affect balances; they get
  `deletedAt` and the balance revert happens in the transaction.
- Rules cannot sum balances: any invariant that needs reading several documents
  belongs to a `runTransaction` operation, not to rules.

## Rules language, not TypeScript

`firestore.rules` is Firebase's CEL-derived language, not JavaScript. A `function`
body is **one `return` with a single expression**.

- No `if` / `else` statements, no second `return`, no local variables, no loops.
  Writing them fails the deploy with `Unexpected 'if'` / `Unexpected 'return'`.
- Branch with the ternary `condition ? whenTrue : whenFalse`, or with `&&` / `||`
  (they short-circuit, so `!('key' in data) || isOptionalId(data.key)` never reads
  a missing key). Split complex logic into small helper functions.
- `allow ...: if <expression>;` is the only valid form in a `match`: that `if` is
  part of the grammar, never a statement.
- A compile error inside one function desynchronises the parser and adds
  misleading errors further down (for example `Unexpected 'match'` on the next
  block). Fix and re-validate the **first** reported line.
- Limits per request: 10 nested function calls, 20 function calls, 1,000
  evaluated expressions and 10 document reads (20 for a query). Never add a
  `get`/`getAfter` inside a helper that is called from several branches.

## Transaction pattern

Reference: `features/transfers/repositories/transfer-create.operation.ts` and
`features/transactions/repositories/*.operation.ts`.

1. Validate ids, amount and self-reference **inside** the transaction.
2. `get` every touched wallet; fail with a coded domain error if missing.
3. Verify `ownerId` on each document; never trust the caller's id.
4. Verify currency compatibility before touching balances.
5. Compute with the shared pure helpers, then write the record and every wallet
   balance in the same transaction.
6. Return the mutated entities so hooks can refresh without a reload.

## Indexes and queries

- Queries filter by `ownerId` and sort client-side, so most collections need no
  composite index. When a new ordered/filtered query is added, update
  `firestore.indexes.json` and mention it in the ticket.
- Keep `firestore.indexes.json` deployed through
  `npm run firebase-deploy:indexes`; agents never deploy rules or indexes.

## Verification and deployment

1. Check that the file compiles **before** asking for a deploy (the check runs
   server-side, publishes nothing):
   `npx firebase deploy --only firestore:rules --dry-run`
2. There is no `@firebase/rules-unit-testing` suite yet, so read the rules
   against every new client call. The emulator is the alternative check
   (`npx firebase emulators:start --only firestore`) and needs JDK 21.
3. Agents never deploy: ask the user to run
   `npm run firebase-deploy:rules` (or `npm run firestore-update-rules` to log in
   first) and exercise the flow.
4. If the ticket adds a rules emulator suite, document it in
   `docs/project/testing/test-guide.md`.
