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
| `wallets` | `ownerId` | hard (archive first) | `ownerId` immutable |
| `transactions` | `ownerId` | hard today | `ownerId` immutable |
| `categories` | `ownerId` | hard, blocked while used | `ownerId`, `type` immutable |
| `transfers` | `ownerId` | **never** (soft `deletedAt`) | `ownerId`, `createdAt` immutable |

Rules helpers: `isSignedIn()` and `isWalletOwner(data)` (actually an owner check
reused by every collection). Reuse them; do not inline `request.auth.uid`
comparisons in new matches unless the helper does not fit.

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

## Verification

There is no `@firebase/rules-unit-testing` suite yet, so verify by reading the
rules against every new client call, then ask the user to deploy with
`npm run firestore-deploy:rules` and exercise the flow. If the ticket adds a
rules emulator suite, document it in `docs/project/testing/test-guide.md`.
