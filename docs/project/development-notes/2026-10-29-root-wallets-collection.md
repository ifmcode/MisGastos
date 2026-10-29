# Session Note: Root Wallets Collection

**Date:** 29/10/2026
**Status:** Done

## Summary

Moved wallets from the `users/{uid}/wallets` subcollection to the root `wallets` collection. Existing wallet test data is disposable and was not migrated.

## Why

The auth flow creates user documents with auto-generated IDs and stores the Firebase UID in the `uid` field. The old wallet path used the UID as a parent document ID, which did not match the actual user documents and could create phantom parents.

A root collection keeps the model consistent:

- `wallets/{walletId}` stores `ownerId`.
- Queries filter by `where("ownerId", "==", uid)`.
- Rules authorize by `ownerId`.

It also leaves room for shared wallets through a future `memberIds` field without changing the collection path.

## Implementation

- `FirebaseWalletRepository` reads and writes `collection(db, "wallets")`.
- Wallets are queried by `ownerId` and sorted by `createdAt` descending in the repository. Client-side sorting avoids requiring a composite `ownerId + createdAt` index for the MVP.
- `firestore.rules` now protects `wallets/{walletId}`:
  - read/delete require `resource.data.ownerId == request.auth.uid`;
  - create requires `request.resource.data.ownerId == request.auth.uid`;
  - update must preserve the owner.
- Repository tests assert the root collection path, owner query and newest-first ordering.
- Updated wallet notes, ticket, security guidelines and project memory.

## Pending manual steps

- Publish `firestore.rules` to `misgastos-61e15`.
- Delete the legacy `users/{uid}/wallets` test subcollection from Firebase Console.
