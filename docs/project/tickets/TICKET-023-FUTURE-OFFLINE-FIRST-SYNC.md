# TICKET-023 - Future Epic: Offline-First and Sync

**Type:** Epic / Architecture  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** PM-023; TICKET-002, TICKET-003, TICKET-007, TICKET-009, TICKET-010  
**Sprint:** Platform / Post-MVP  

## Description
Make the app usable without an internet connection. The user must be able to create expenses, incomes, transfers and shared movements while offline, see the changes immediately, and sync them with Firebase when connectivity returns.

## Requirements
- [ ] Choose the local persistence and sync architecture before implementation
- [ ] Persist wallets, transactions, transfers, categories, friends, groups, shared expenses and settlements locally
- [ ] Allow creating, editing and deleting expenses/incomes and transfers while offline
- [ ] Allow creating group expenses and settlements while offline
- [ ] Queue offline mutations with idempotency keys, retry and backoff
- [ ] Sync on app start and on reconnect, preserving mutation order and dependencies
- [ ] Recalculate wallet balances and group debts locally with the same rules as the online path
- [ ] Define conflict resolution for edits made on multiple devices
- [ ] Surface conflicts to the user instead of silently overwriting money data
- [ ] Show offline state, pending changes, last sync time and a manual retry action
- [ ] Clear or isolate local data on logout and account switching
- [ ] Add unit tests for the queue/conflict logic and integration tests for offline -> online flows

## Acceptance Criteria
- [ ] Creating an expense, income or transfer offline works and survives an app restart
- [ ] Reconnecting syncs each queued mutation exactly once, with no duplicates
- [ ] Offline group/friend movements sync and balances remain correct
- [ ] A conflicting edit is reported and never silently discards one user's data
- [ ] The user can see what is pending and retry a failed sync
- [ ] The app remains usable when Firebase is temporarily unavailable
- [ ] Logging out removes local access to the previous account's data
- [ ] Existing online behaviour and balance rules do not regress

## Technical Notes
- The app currently writes directly to Firestore and uses `runTransaction` for wallet balance consistency. Firestore's built-in offline cache handles some writes but does not reliably solve multi-document transactions, shared ledgers or conflict resolution while offline. Do not assume it is enough.
- Evaluate these options in a short design spike:
  1. Local SQLite (Expo SQLite or WatermelonDB) plus a custom outbox/sync engine.
  2. Firestore persistent cache plus a local mutation queue and server reconciliation.
  3. An event-sourced local ledger with Firebase as the remote projection.
- Prefer client-generated ids and a `clientMutationId` for idempotency. Store `createdAt`, `updatedAt`, `deletedAt` and a sync status locally.
- Money and balances must remain deterministic. Do not use blind last-write-wins for financial operations; define a server-authoritative merge or an explicit conflict UI.
- Treat the offline feature as an epic and split it into phases:
  1. Architecture spike and ADR.
  2. Local read cache for personal data.
  3. Offline write queue for expenses, incomes and transfers.
  4. Sync, retry and conflict handling.
  5. Offline group/friend movements.
  6. Offline UX polish and observability.
- Mobile is the primary target. Web offline support may use IndexedDB, but it can be a separate phase if it delays the mobile release.

## Open Questions
- How long must offline data be retained?
- Are multi-device edits expected, or is one device per account the norm?
- Should users be able to create a brand-new group while offline?
- Is local encryption required, or is OS-level storage protection enough?
- Can Firebase be replaced by a custom backend if the sync requirements outgrow it?
