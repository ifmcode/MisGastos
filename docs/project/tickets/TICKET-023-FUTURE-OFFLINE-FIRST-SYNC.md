# TICKET-023 - Future Epic: Offline-First and Sync

**Type:** Epic / Architecture  
**Priority:** High  
**Status:** 🚧 In progress  
**Design spike:** ✅ Accepted (14/11/2026) — implementation started 24/11/2026 (foundations only)  
**Related:** PM-023; TICKET-002, TICKET-003, TICKET-007, TICKET-009, TICKET-010  
**Sprint:** Platform / Post-MVP  

## Description
Make the app usable without an internet connection. The user must be able to create expenses, incomes, transfers and shared movements while offline, see the changes immediately, and sync them with Firebase when connectivity returns.

## Requirements
- [x] Choose the local persistence and sync architecture before implementation — decided on 14/11/2026 (see **Design Spike**)
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

## Progress (24/11/2026)

First implementation slice: **prerequisites 3-5 of ADR §11 only** (the technical
base). No requirement or acceptance criterion above is closed by it, and the epic
stays `🚧 In progress`.

**Delivered:** the new `shared/lib/local-db/` layer (26 source modules plus
`__tests__/`) with a row-oriented `DatabasePort` and a `LocalDatabaseTransaction` so
every write can join one transaction (record + balance + outbox row in Phase 4); the
version 1 schema (`wallets`, `categories`, `transactions`, `transfers`, `outbox`,
`conflicts`, `syncState`) with the ADR indexes; append-only migrations applied inside
one transaction with `PRAGMA user_version`, rejecting a newer database with
`LOCAL_DB_SCHEMA_NEWER`; an `expo-sqlite` adapter (the only module importing the
native package) and an in-memory adapter for Jest; the outbox repository, its state
machine, coalescing matrix, `seq` ordering, retry window and `reclaimInterrupted`; and
`syncState` bookkeeping. The duplicate `getSignedTransactionAmount` helpers were
removed from `transaction-firestore.utils.ts`, leaving
`features/transactions/utils/transaction-balance.ts` as the single implementation used
by the create/update/delete operations.

**Schema decisions:** the queue counter lives in a new `outboxSeq(ownerId, nextSeq)`
row because an autoincrement column cannot keep `seq` monotonic once the queue is
drained, and `outbox` gained an `operation` column that ADR §4 omitted and coalescing
requires.

**Deviation:** the signed-amount helper stays in `features/transactions/utils` (not in
`shared/` as ADR §11.3 planned) because it imports `roundMoney` from
`features/wallets/utils/money`; it moves in the Phase 4 slice that introduces the
pending-delta calculation.

**Dependency:** `expo-sqlite@~58.0.15` added with `npm install` because
`npx expo install` fails with the corporate certificate. Nothing imports it at runtime
yet, so no rebuild is needed until Phase 3 wires it.

**Not delivered (every epic checkbox stays open):** client-generated ids,
`revision`/`deletedAt`/`appliedMutations` and rules, local read cache, offline write
queue, sync engine, conflicts and offline social.

**Verification:** `npx tsc --noEmit`, `npx expo lint` and `npm run check:copy` clean;
`npm run test:coverage` → 397 suites / 2645 tests, global 98.95 % statements,
94.96 % branches, 98.72 % functions, 99.54 % lines. No `firestore.rules` or index
change, so nothing to deploy and nothing to validate on a device yet.

**Next slice:** client-generated ids plus `revision`/`deletedAt`/`appliedMutations`
and the corresponding rules (prerequisites 1-2).

**Detail:** [`session-notes/2026-11-24-offline-local-db-foundations.md`](../development-notes/session-notes/2026-11-24-offline-local-db-foundations.md)

## Design Spike (14/11/2026)

**Status:** ✅ Accepted. **No app code changed** in this session; the epic stays in progress until the
implementation phases below are delivered.

**Full document:** [`docs/project/development-notes/session-notes/2026-11-14-offline-first-architecture.md`](../development-notes/session-notes/2026-11-14-offline-first-architecture.md)

### Decisions

1. **Persistence:** `expo-sqlite` as the on-device source of truth, explicit schema + migrations,
   `DatabasePort` abstraction with an in-memory adapter for Jest. AsyncStorage keeps preferences only.
2. **Sync model:** local-first repositories + one coalesced, ordered **outbox** per account, drained by a
   sync engine that calls the existing Firestore operations. Feature hooks, screens and domain types
   do not change.
3. **Idempotency:** client-generated ids plus a `clientMutationId`. A new
   `appliedMutations/{ownerId}__{clientMutationId}` marker is written inside the same
   `runTransaction` as the balance change, giving exactly-once replay after a crash or lost ack.
4. **Balances:** the server stays authoritative; the UI shows `serverBalance + pendingDelta`, where the
   delta is recomputed from the outbox with the **same pure helpers** as the online path
   (`getSignedTransactionAmount`, `applyTransferToBalances`, `roundMoney`). No second balance formula.
5. **Conflicts:** per-record `revision` optimistic concurrency. A mismatch stops the mutation and
   opens an explicit conflict UI (`REMOTE_CHANGED`, `DELETED_REMOTELY`, `WALLET_UNAVAILABLE`,
   `INSUFFICIENT_FUNDS`, `INVALID`). No last-write-wins on money; nothing is discarded without a user
   choice.
6. **Ordering:** strict `seq` order per account plus `dependsOn` for entities created offline (a
   movement waits for its wallet). Retry with exponential backoff and jitter for transient errors.
7. **Reads:** full pull on login/first start, then owner-scoped `onSnapshot` listeners while foreground
   and logged in; tombstones are pulled and filtered locally.
8. **Isolation:** every row is scoped by `ownerId`; logout/account switch stops the engine, removes
   listeners and purges that account's rows, outbox and conflicts (with a warning if changes are pending).
9. **Soft deletes:** transactions move from hard delete to `deletedAt` (business rule + offline order);
   `deletedAt` becomes updateable in the rules. Wallets keep `archivedAt`.
10. **Security:** OS-level storage protection for V1, no secrets in SQLite; SQLCipher is a documented
    upgrade path behind `DatabasePort`.
11. **Social phase constraint:** from TICKET-009/TICKET-010 onward, shared expenses and settlements are
    **append-only ledger entries** folded by a shared pure function. Edits are compensating entries.
    Offline group creation is allowed; invites/joining stay online.
12. **Web:** offline support is a separate later phase; mobile is the primary target.

### Delivery phases (implementation)

| # | Phase | Roadmap |
|---|---|---|
| 1 | Architecture spike and ADR | ✅ Phase 4 (this session) |
| 2 | Local DB foundations, client ids, `revision`/`deletedAt`/`appliedMutations` + rules | Phase 7 |
| 3 | Local read cache for personal data | Phase 7 |
| 4 | Offline write queue for expenses, incomes and transfers | Phase 7 |
| 5 | Sync engine, retry, exactly-once and conflicts | Phase 7 |
| 6 | Offline group/friend movements | Phase 7 (after TICKET-009/010) |
| 7 | Offline UX, observability, account purge and web decision | Phase 7 |

### Acceptance criteria mapping

| Acceptance criterion | Phase |
|---|---|
| Offline create survives an app restart | 4 |
| Exactly-once sync on reconnect | 5 |
| Offline group/friend movements keep balances correct | 6 |
| Conflicting edit reported, never silently discarded | 5 |
| User sees pending changes and can retry a failed sync | 7 (basic banner in 3) |
| App usable while Firebase is unavailable | 3-4 |
| Logout removes local access to the previous account's data | 7 |
| Existing online behaviour and balance rules do not regress | 2 + parity tests in every phase |

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

## Open Questions (resolved 14/11/2026)
- How long must offline data be retained? → Until logout, account switch or an explicit local purge. Confirmed financial records are not expired by TTL; outbox and conflicts never expire automatically.
- Are multi-device edits expected, or is one device per account the norm? → **Multi-device is expected**; revision-based conflicts are part of the design from the start.
- Should users be able to create a brand-new group while offline? → Yes for groups the user creates; inviting/joining/accepting requires connectivity.
- Is local encryption required, or is OS-level storage protection enough? → OS-level protection is enough for V1; SQLCipher stays as an upgrade path behind `DatabasePort`.
- Can Firebase be replaced by a custom backend if the sync requirements outgrow it? → Out of V1. The outbox depends on a `RemoteMutationExecutor` interface, so a server-authoritative Cloud Function (first) or an HTTP backend (later) can replace Firestore without touching the UI or the local schema.

