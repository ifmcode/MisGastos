# Offline-First Architecture (TICKET-023 design spike)

> Date: 14/11/2026
> Status: Accepted (design only — implementation is Phase 7)
> Related: `roadmap.md` phases 4 and 7, `tickets/TICKET-023-FUTURE-OFFLINE-FIRST-SYNC.md`,
> TICKET-002/003 (movements and transfers), TICKET-007/009/010 (friends, shared expenses, balances),
> `guidelines/architecture-and-solid.md`, `testing/test-guide.md`

## 1. Context

The app is Firestore-only today:

- Every screen reads through a feature repository (`getDocs`/`getDoc`, no listeners) and each tab
  refreshes on focus.
- Balances are stored in `wallets.balance` and mutated inside `runTransaction` by
  `transaction-create/update/delete.operation.ts` and the transfer operations. The wallet document
  and the movement document always change together.
- `lib/firebase.ts` calls `getFirestore(app)` without `initializeFirestore`/`localCache`, so the SDK
  keeps documents in **memory only**: writes are queued in memory and are lost on app restart.
- Ids are server-generated for wallets, transactions and categories (`addDoc`); only transfers and
  seeded categories use client-generated ids.
- Transfers are soft-deleted (`deletedAt`); transactions and categories are hard-deleted; wallets are
  archived (`archivedAt`) or deleted with reassignment to another wallet / the `-1` orphan id.
- Timestamps are client ISO strings (`createdAt`/`updatedAt`); `transfers.createdAt` is immutable by
  rule.

### Why the current model cannot satisfy TICKET-023

| Acceptance criterion | Today |
|---|---|
| Offline create survives an app restart | ❌ writes only live in memory |
| Reconnect syncs each mutation exactly once | ❌ no queue, no idempotency key, `addDoc` would duplicate |
| Conflicting edit is reported, never silently discarded | ❌ updates overwrite the whole document |
| App usable while Firebase is unavailable | ❌ reads/writes fail, balances cannot be computed |

Firestore's offline support does not close this gap by itself:

- Transactions **fail when the client is offline in the Firestore JS SDK used by Expo**, even with a
  persistent cache, and this app's balance invariant is enforced by multi-document transactions.
- Persistent cache has no outbox, no ordering guarantees across restarts, no idempotency keys, and no
  conflict model for concurrent edits. Its merge is effectively last-write-wins per document.
- It would couple the sync engine to Firestore and make a later backend replacement harder.

## 2. Decision

Adopt a **local SQLite database as the on-device source of truth, with a custom outbox and a
server-authoritative reconciliation step**:

1. **Persistence:** `expo-sqlite` (official Expo module, no ORM) with explicit migrations. AsyncStorage
   keeps only preferences (theme, language), exactly as today.
2. **Reads:** feature repositories read from SQLite. Firestore is pulled into SQLite by the sync
   engine; screens keep their existing hooks and domain types.
3. **Writes:** feature repositories validate and write to SQLite inside one transaction (record +
   balance effect), then append a coalesced mutation to the outbox. The UI never waits on the network.
4. **Sync:** a single ordered outbox per account is drained by a sync engine that calls the existing
   Firestore operations, now idempotent and revision-guarded.
5. **Balances:** local displayed balance = last server balance + pending local deltas, computed with
   the **same pure helpers** the online path uses. The server remains authoritative once a mutation is
   applied.
6. **Conflicts:** optimistic concurrency with a per-record `revision`; a mismatch stops the mutation
   and opens an explicit conflict UI. No automatic merge of money data.
7. **Ids:** all money records use client-generated ids (`doc(collection(...))` or `randomUUID()`), so
   local rows can reference each other before the first sync. Every mutation carries a
   `clientMutationId`.

**Multi-device edits are expected**, so conflict detection is a first-class part of the design, not a
future add-on.

### Options evaluated

| Option | Verdict |
|---|---|
| **A. SQLite (expo-sqlite) + custom outbox** | **Chosen.** Durable across restarts, deterministic transactions, full control of ordering/idempotency/conflicts, works on iOS/Android and (adapter-dependent) web, no backend lock-in, testable without native deps through a `DatabasePort`. Cost: we own schema, migrations and the sync protocol. |
| B. Firestore persistent cache + mutation queue | Rejected. Transactions fail offline (the current balance rule), the cache is not a durable mutation log, no idempotency or conflict primitives, and it hard-couples the data layer to Firebase. It would also force a second parallel write path. |
| C. Event-sourced local ledger with Firebase as a projection | Rejected as the *primary* model for personal wallets: a big conceptual rewrite of balances, history and rules for no user-facing gain over A + derived deltas. **Adopted selectively** for shared/group ledgers, where append-only entries are the correct convergence model (§10). |
| WatermelonDB (variant of A) | Deferred. Mature sync-first ORM, but no real web target, extra model layer, and the sync protocol would still be custom. Revisit only if the schema becomes relational-heavy. |

## 3. Layers and folder placement

```text
shared/lib/local-db/
  database.ts            # openDatabase + migrate on start
  database.port.ts       # DatabasePort (execute/query/transaction) — enables a Jest fake
  expo-sqlite.database.ts
  in-memory.database.ts  # tests only
  schema.ts              # DDL version 1
  migrations/            # one file per version
  outbox.repository.ts   # enqueue/read/update rows
  sync-state.repository.ts

shared/services/sync/
  sync-engine.ts         # orchestration (push → pull, triggers)
  mutation-queue.ts      # coalesce, order, dependency resolution
  mutation-executor.ts   # RemoteMutationExecutor interface + Firestore implementation
  sync-errors.ts         # classification (transient / permanent / conflict)
  backoff.ts             # pure retry policy
  conflict-policy.ts     # pure conflict building/resolution

features/<feature>/repositories/
  local-<feature>.repository.ts   # SQLite reads/writes + outbox enqueue
  firebase-<feature>.repository.ts # existing remote implementation, used by the executor

features/sync/          # UI: provider, hooks, sync center, banner copy
```

Rules: services and utils stay React-free; the engine never imports a feature component; feature
repositories keep implementing the existing `IFooRepository` interfaces, so hooks and screens do not
change when the local implementation lands. `DatabasePort` keeps Jest free of native modules and keeps
the 90% coverage gate meaningful.

## 4. Local schema (version 1)

SQLite types are simple (`TEXT` for ISO dates, `INTEGER` for booleans). Every table carries
`ownerId`, `syncStatus` (`synced | pending | syncing | failed | conflict`) and the audit fields the
ticket requires (`createdAt`, `updatedAt`, `deletedAt`).

```sql
wallets(id PK, ownerId, name, currency, type, icon, color, initialBalance,
        serverBalance REAL, includeInTotal, description, archivedAt,
        createdAt, updatedAt, deletedAt, revision, syncStatus)

categories(id PK, ownerId, name, type, color, icon, sortOrder, legacyId,
           createdAt, updatedAt, deletedAt, revision, syncStatus)

transactions(id PK, ownerId, type, amount, currency, walletId, walletName,
             categoryId, concept, date, notes,
             createdAt, updatedAt, deletedAt, revision, syncStatus)

transfers(id PK, ownerId, fromWalletId, toWalletId, amount, currency, date,
          notes, createdAt, updatedAt, deletedAt, revision, syncStatus)

outbox(clientMutationId PK, ownerId, seq INTEGER, entityType, entityId,
       baseRevision, localSnapshot TEXT, serverSnapshot TEXT,
       dependsOn TEXT, status, attempts, nextAttemptAt, lastErrorCode,
       createdAt, updatedAt,
       UNIQUE(ownerId, entityType, entityId))   -- one pending mutation per record

conflicts(id PK, ownerId, clientMutationId, entityType, entityId, kind,
          localSnapshot, remoteSnapshot, detectedAt, resolvedAt, resolution)

syncState(ownerId PK, lastPullAt, lastPushAt, lastFullSyncAt, lastErrorCode)
```

Design notes:

- **Coalescing:** editing the same record twice offline keeps one outbox row (latest
  `localSnapshot`), so replay is deterministic and quick.
- **Create then delete before syncing** ⇒ the outbox row is dropped and nothing is sent.
- `serverSnapshot` is the last known remote state; it powers the three-way comparison and the
  pending-delta calculation.
- Indexes: `wallets(ownerId, archivedAt, createdAt)`, `transactions(ownerId, date DESC)`,
  `transactions(ownerId, walletId)`, `outbox(ownerId, seq)`.
- Lists keep being sorted in JS by the existing utilities (`sortTransfersByDate`, category order…);
  SQL only narrows by owner/date once volume makes it necessary.
- One database file (`misgastos.db`). **Rows are scoped and purged by `ownerId`**, never by sharing a
  file between accounts.

## 5. Sync engine

### 5.1 Outbox lifecycle

```text
enqueue ──► pending ──► syncing ──► (success) delete row, pull remote snapshot
                ▲            │
                │            ├──► failed    (permanent error, manual retry)
                └────────────┴──► conflict  (revision mismatch / semantic conflict)
```

- `seq` is monotonic per owner (SQLite autoincrement in the same write transaction).
- The queue is drained **strictly in order**. A mutation waits while any `dependsOn` entity is still
  pending (for example a movement created against a wallet created offline). Head-of-line blocking is
  accepted: financial order matters more than throughput, and the queue is small.
- Triggers: after a successful local write (debounced), app start after auth, app foreground, network
  reconnect (`@react-native-community/netinfo`), manual **Reintentar**, and a 5-minute timer while
  `pending > 0`.

### 5.2 Exactly-once protocol

Every Firestore operation gains two inputs: `clientMutationId` and `baseRevision`. Inside the
existing `runTransaction`, before touching money:

```text
markerRef = appliedMutations/{ownerId}__{clientMutationId}
if markerRef exists              → return without applying (replay-safe)
if remote doc missing            → conflict DELETED_REMOTELY (updates/deletes)
if remote.revision != baseRevision → conflict REMOTE_CHANGED
apply the movement + balance, set revision = baseRevision + 1
create marker { ownerId, clientMutationId, entityType, entityId, revisionAfter, appliedAt }
```

The marker and the data change are atomic, so a crash after the commit but before the ack causes a
replay that is detected and skipped. Deletes are soft (`deletedAt`) and count as a revision bump.

Firestore rules changes required:

- `appliedMutations/{id}`: create only when `ownerId == request.auth.uid`; **no update, no delete**.
- `revision`: required and monotonically `+1` on updates of `wallets`, `transactions`, `transfers`,
  `categories`.
- `deletedAt` becomes updateable (transactions move from hard delete to soft delete).
- `clientMutationId` must be immutable once written.

### 5.3 Retry and backoff

- **Transient** (`unavailable`, `deadline-exceeded`, `network-request-failed`, `resource-exhausted`):
  retry with `min(1s · 2^attempts, 5min)` plus ±20% jitter; the queue pauses instead of skipping order.
- **Permanent** (`permission-denied`, validation/`invalid-argument`, `WALLET_NOT_FOUND`): `failed`, with
  the error code surfaced; only a user action or a data fix resumes it.
- **Conflict signals** (`REMOTE_CHANGED`, `DELETED_REMOTELY`, `WALLET_UNAVAILABLE`,
  `INSUFFICIENT_FUNDS`, `CURRENCY_MISMATCH`): `conflict`, never retried automatically.

### 5.4 Pull

- Login / first start: full `getDocs` per collection (today's behaviour), written into SQLite in one
  transaction.
- While online: `onSnapshot` per owner-scoped collection. Snapshots are ignored for rows with
  `syncStatus` `pending`/`conflict` (local data wins until the user resolves), but the remote payload
  is stored as `remoteSnapshot` for the conflict UI.
- Deleted records are pulled too (`deletedAt` tombstones); filtering is local, as it is today.
- Pull runs **after** the push cycle so the freshly applied mutations land as server state. Listeners
  are unsubscribed on logout.
- `lastPullAt`/`lastPushAt`/`lastErrorCode` live in `syncState` and drive the sync status UI.

## 6. Balance correctness

Balances must stay deterministic and identical between the two paths.

- The balance math already lives in pure helpers (`roundMoney`, `calculateWalletBalance`,
  `getSignedTransactionAmount`, `hasSufficientBalance`, `applyTransferToBalances`). Implementation
  step 1 moves `getSignedTransactionAmount` out of `transaction-firestore.utils.ts` into a shared
  domain util so both paths import exactly one implementation.
- **Local write:** `BEGIN; upsert movement; update wallet; insert outbox row; COMMIT`. The wallet is
  updated with the same signed-amount/transfer helpers as the online operation, including
  insufficient-funds validation before a transfer.
- **Displayed balance:** `Wallet.balance = roundMoney(serverBalance + pendingDelta)` where
  `pendingDelta` is recomputed from the outbox (`localSnapshot` vs `serverSnapshot`) after every push
  and pull. It is never accumulated blindly, so a lost ack cannot drift the number.
- **Server reconciliation:** after a successful push or pull, `serverBalance` takes the remote value;
  pending deltas are re-applied on top for display only. No local value ever overwrites the server
  without passing through the idempotent transaction.
- Shared rules preserved: archived wallets leave selectors/totals, the `-1` orphan id never affects a
  wallet balance, transfers keep reversion semantics on edit/delete, and currency never changes.

## 7. Conflict policy

Detection is per record with `revision`; semantic conflicts are caught when the executor re-validates
against server state. Each conflict stores both snapshots and a stable `kind`.

| Kind | Cause | User options |
|---|---|---|
| `REMOTE_CHANGED` | another device edited the record after the local base revision | keep mine (rebase and re-enqueue), keep remote (discard mine) |
| `DELETED_REMOTELY` | the record no longer exists on the server | discard, or re-create as a new record |
| `WALLET_UNAVAILABLE` | the wallet was deleted/archived/changed currency remotely | choose another wallet locally, or discard |
| `INSUFFICIENT_FUNDS` | a queued transfer no longer fits the server balance | edit the amount, or discard |
| `INVALID` | server rejects the payload permanently | edit, or discard |

Rules:

- **No blind last-write-wins.** A conflict always stops the mutation and is visible.
- "Keep mine" is an explicit user decision; it rebases `baseRevision` to the remote revision and retries
  once. "Keep remote" replaces the local row. Nothing is deleted without a choice.
- Conflicts are never auto-dismissed, survive restarts, and block dependent mutations until resolved.
- The UI is a page-sheet modal listing **Tu cambio** vs **Cambio de otro dispositivo**, with the
  money values, wallet and date highlighted.

## 8. Offline UX and observability

- `OfflineBanner` in the tabs shell: `Sin conexión · N cambios pendientes` and a sync action.
- `SyncProvider` exposes `status`, `pendingCount`, `conflictCount`, `lastSyncAt`, `retry()`.
- Settings gains a **Sincronización** block: last successful sync, pending count, conflict entry point
  and **Reintentar ahora**.
- Rows with unsynced data show a small **Pendiente** badge; the detail view shows the sync state.
- Error codes (translated in the UI, never sentences from services): `SYNC_OFFLINE`,
  `SYNC_PENDING`, `SYNC_CONFLICT`, `SYNC_PERMANENT_ERROR`, `OFFLINE_UNSUPPORTED_ACTION`.
- Out of scope for V1: background sync while the app is killed, push notifications, analytics.

## 9. Account isolation and security

- Every row, the outbox, conflicts and `syncState` are scoped by `ownerId`; every query filters by it.
- On logout **and** on account switch: cancel the sync engine, unsubscribe listeners, clear in-memory
  caches and delete all local rows for that `ownerId` (outbox, conflicts included). Never reuse another
  account's rows.
- If pending mutations exist at logout, warn the user before discarding them (explicit "sign out and
  lose N changes" confirmation) instead of silently dropping money data.
- No tokens or personal secrets in SQLite; Firebase Auth persistence stays in AsyncStorage.
- **Encryption:** OS-level protection for V1 (iOS Data Protection, Android file-based encryption,
  app-private sandbox). SQLCipher is not part of the design; if it becomes a requirement, use a
  dev-client build (`op-sqlite`/SQLCipher) behind the same `DatabasePort`.
- Web: OPFS/IndexedDB is origin-scoped but not encrypted; web offline is a later phase.

## 10. Constraints this imposes on the social phase

The spike exists before groups for a reason. TICKET-008/009/010 must be built so offline works
without a rewrite:

- Shared expenses and settlements are **append-only ledger entries** with client-generated ids and
  `clientMutationId`. Editing or voiding an expense creates a compensating entry (`voidsEntryId`), it
  does not mutate the original.
- Group balances are a **pure fold over the entries** (`equal`, `percentage`, `fixed`, `shares`),
  sorted deterministically by `(appliedAt, id)`; both the online and offline paths import the same
  fold. This makes offline contributions converge without merges.
- `revision` guards only mutable group metadata (name, currency, membership).
- Creating a brand-new group offline is allowed (client id, local placeholders for members); sending
  invitations and **joining/accepting** a group require connectivity.

## 11. Implementation prerequisites (before Phase 7 feature work)

1. Client-generated ids for wallets, transactions and categories (`doc(collection(...))`), keeping
   client id + outbox id consistent.
2. `revision`, `updatedAt` discipline and soft delete for transactions in Firestore + rules;
   `appliedMutations` collection and rules; legacy documents treated as revision `0` with a backfill
   script.
3. Move the signed-amount helper to a shared domain util so offline and online share one implementation.
4. Add `expo-sqlite`, `expo-crypto` (uuid), `@react-native-community/netinfo`.
5. `DatabasePort` + schema + migrations + in-memory adapter for tests.
6. Keep `getFirestore(app)` as-is (memory cache): SQLite is the durable store, so enabling the
   Firestore persistent cache would duplicate storage with no benefit.

## 12. Phased delivery

| Phase | Deliverable | Exit criteria |
|---|---|---|
| 1. Spike / ADR (this document) | Decisions, schema, protocol | Accepted; no code changed |
| 2. Foundations | `DatabasePort`, schema/migrations, outbox repository + state machine, prerequisites 1-4 | Unit tests green, online app unchanged (feature-flagged) |
| 3. Local read cache | Pull wallets/categories/transactions/transfers into SQLite; local repositories for reads; `OfflineBanner` | App opens and lists data in airplane mode after one online load |
| 4. Offline write queue | Local create/edit/delete for expenses, incomes and transfers + local balance derivation | Offline writes survive a restart; balances match the online rules |
| 5. Sync, retry, conflicts | Push/pull engine, idempotency, backoff, revision conflicts | Exactly-once verified; conflicts surfaced and resolvable |
| 6. Offline social | Friends, groups, shared expenses and settlements on the same outbox/ledger | Offline group movements sync; balances correct |
| 7. Polish and observability | Sync center, manual retry, account-switch purge, web decision | Acceptance criteria of TICKET-023 met; online path not regressed |

Feature flag `offline_first` (Settings → developer entry or env) lets Phase 3-5 ship behind a switch
until the full flow is verified.

## 13. Testing strategy

- **Pure units (coverage gate):** outbox coalescing/ordering/dependency resolution, backoff,
  error classification, conflict construction/resolution, pending-delta and displayed-balance helpers.
- **Repository tests:** `InMemoryDatabase` implements `DatabasePort`; no native module in Jest.
- **Parity tests:** the same scenario (create, edit, delete, transfer, insufficient funds) executed
  through the local repository and through the Firestore operation with mocked SDK must yield the same
  balances and audit fields.
- **Exactly-once tests:** run the executor twice with the same `clientMutationId`; assert one data
  change and one marker.
- **Restart tests:** rebuild the repositories over the same in-memory DB and assert pending writes and
  conflicts are still there.
- **Integration flows:** offline → reconnect → sync; conflict → keep mine/keep remote; wallet created
  and used offline. The executor is faked to simulate offline, transient errors and duplicates.
- **Manual checklist** to add to `docs/project/testing/`: airplane mode, app kill/relaunch, reconnect,
  two devices, logout with pending changes, account switch.

## 14. Resolved open questions

| Question | Decision |
|---|---|
| How long must offline data be retained? | Until logout/account switch or an explicit **Borrar datos locales** action. Confirmed financial records are never expired by TTL; the outbox and conflicts never expire automatically. Volume is small for a personal finance app. |
| Multi-device edits expected? | **Yes.** Full revision-based conflict detection from the start; conflicts are a first-class UX. |
| Create a brand-new group offline? | Yes for groups the user creates (client id, local member placeholders); inviting members, joining and accepting require connectivity. Implemented with the social phase under the append-only constraint. |
| Local encryption required? | Not in V1. Rely on OS-level storage protection, never store secrets locally, and keep SQLCipher as a documented upgrade behind `DatabasePort`. |
| Can Firebase be replaced? | Out of V1, but the design keeps the door open: the outbox only depends on `RemoteMutationExecutor`. If guarantees outgrow Firestore, the first step is a server-authoritative Cloud Function executor, then an HTTP backend, without touching the UI or local schema. |

## 15. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Local and server balances drift | Server-authoritative pull, recomputed pending deltas, shared pure helpers, parity tests |
| Rules/deploy break existing clients | Lenient revision rules during the transition, backfill script, deploy rules before shipping the client |
| Data loss from a corrupted queue | SQLite transactions, coalescing rules, conflicts retained until resolved, logout warning |
| Clock skew | Ordering by `seq`/`revision`, never by client timestamps; server timestamps for audit |
| Scope creep | Phases with exit criteria and a feature flag; web offline and background sync explicitly out of scope |
| `expo-sqlite` web support | Verify in Phase 2; web can stay online-only with the in-memory adapter if it blocks mobile |
| Listener cost and battery | Owner-scoped listeners only while foreground and logged in; unsubscribe on logout |
| Permanent wallet deletion offline | Blocked offline (online-only action) with a clear error code; archive works offline |
| Legacy documents without `revision` | Treat as `0`, first update sets `1`, one-off backfill, tests |

## 16. Out of scope (V1)

- Background sync while the app is killed; real-time collaborative editing.
- Offline permanent wallet deletion, offline email/password changes, offline profile avatar work.
- Currency conversion.
- Web offline support in the mobile milestone (designed but a separate phase).
- Local database encryption (SQLCipher) and per-field encryption.
- Automatic or heuristic merge of financial records.
