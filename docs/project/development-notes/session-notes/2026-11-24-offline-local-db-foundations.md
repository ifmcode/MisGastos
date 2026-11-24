# Offline local database foundations (TICKET-023, first slice)

> Date: 24/11/2026
> Status: Delivered — foundations only. TICKET-023 stays `🚧 In progress`.
> Related: `roadmap.md` Phase 7, `tickets/TICKET-023-FUTURE-OFFLINE-FIRST-SYNC.md`,
> the accepted ADR [`2026-11-14-offline-first-architecture.md`](2026-11-14-offline-first-architecture.md),
> `guidelines/architecture-and-solid.md`, `testing/test-guide.md`

## Context

The ADR was accepted on 14/11/2026 and Phase 7 opened after groups closed on
24/11/2026. ADR §11 lists six implementation prerequisites; §12 groups them into
seven delivery phases. This slice agreed with the user covers **prerequisites 3-5
only**: one signed-amount implementation, the dependencies needed to run it, and
`DatabasePort` + schema + migrations + in-memory adapter. It is the technical base
the read cache, the write queue and the sync engine will sit on, not a user-facing
offline mode.

Delivered in `shared/lib/local-db/`: 26 source modules plus `__tests__/` (18 test
files and 3 shared fixtures/fakes). Nothing imports the layer at runtime yet, so the
online app behaves exactly as before.

## Delivered

### 1. `DatabasePort` (prerequisite 5)

- `database.port.ts` defines `LocalDatabaseTransaction` (`upsert`, `update`,
  `delete`, `select`, `count`, `executeStatements`, `setSchemaVersion`) and
  `DatabasePort extends LocalDatabaseTransaction`
  (`transaction`, `getSchemaVersion`, `close`).
- **Row-oriented, not raw SQL.** Repositories pass table, row, `where`, `orderBy`
  and `limit`; the port builds no SQL. This is what lets `in-memory.database.ts`
  implement the identical contract, so Jest never loads a native module and the
  coverage gate stays meaningful (ADR §3 rationale).
- The table union (`wallets | categories | transactions | transfers | outbox |
  outboxSeq | conflicts | syncState`) and the row/where types live in
  `local-db.types.ts`; there is no dynamic SQL surface for user input.
- Every repository write takes an optional trailing `tx`, so a use case can commit
  record + wallet balance + outbox row atomically in Phase 4. Omitted, the
  repository owns the transaction through `local-transaction.ts`
  (`runInLocalTransaction`).

### 2. Schema v1

- `schema.tables.ts` holds the DDL, `schema.ts` exports `SCHEMA_V1_STATEMENTS`
  (tables then indexes) and `schema.keys.ts` the key contract
  (`LOCAL_DB_PRIMARY_KEYS`, `LOCAL_DB_UNIQUE_KEYS`).
- Tables follow ADR §4: `wallets`, `categories`, `transactions`, `transfers`,
  `outbox`, `conflicts`, `syncState`, each record table carrying `ownerId`,
  `syncStatus` (`synced | pending | syncing | failed | conflict`), `createdAt`,
  `updatedAt`, `deletedAt` and `revision`.
- Indexes: `wallets(ownerId, archivedAt, createdAt)`,
  `transactions(ownerId, date)`, `transactions(ownerId, walletId)`,
  `outbox(ownerId, seq)` and `conflicts(ownerId)`.
- `outbox` keeps `UNIQUE (ownerId, entityType, entityId)`: one queued mutation per
  record. The in-memory adapter enforces the same constraint (see §5), so a
  repository bug fails in Jest instead of only on a device.

### 3. Two schema additions decided during the slice

1. **`outboxSeq(ownerId PK, nextSeq)`.** ADR §5.1 said "SQLite autoincrement in the
   same write transaction", but the queue deletes rows on success, so an
   autoincrement column would reset or lag and `seq` would stop being monotonic.
   A per-account counter row survives a drained queue and keeps strict ordering
   across restarts. It is also a table in `LOCAL_DB_PRIMARY_KEYS`.
2. **`outbox.operation` (`create | update | delete`).** The coalescing matrix
   cannot work without the operation of the queued mutation, and the ADR §4 table
   omitted the column. It is persisted per row and never derived from the payload.

### 4. Migrations

- `migrations/migration-001.ts` + `migrations/index.ts` append-only list with
  `LATEST_SCHEMA_VERSION` derived from it.
- `database.ts` exposes `migrateLocalDatabase(port)`: reads the stored version,
  applies every pending migration **inside one transaction**, writes the version in
  the same transaction (DDL and bookkeeping commit together) and returns how many
  migrations ran. Idempotent: a second call applies nothing.
- A database written by a newer binary is rejected with `LOCAL_DB_SCHEMA_NEWER`
  instead of being read with missing columns; any failure is wrapped as
  `LOCAL_DB_MIGRATION_FAILED` with the cause, leaving the previous version intact.

### 5. Adapters

- **SQLite** (`sqlite-port.ts`, `sqlite-port.statements.ts`, `expo-sqlite.sql.ts`,
  `expo-sqlite.database.ts`): statement building is pure and unit-tested,
  identifiers are quoted, values are always bound, upserts are
  `INSERT … ON CONFLICT(<pk>) DO UPDATE` (a plain `INSERT OR REPLACE` would delete
  the row and silently drop columns the payload omits) and writes run through
  `withExclusiveTransactionAsync`. `expo-sqlite.database.ts` is the **only** module
  importing `expo-sqlite`, which keeps the native dependency behind the port.
- **In-memory** (`in-memory.database.ts`, `in-memory.helpers.ts`): mirrors SQLite
  semantics for the parts repositories rely on — `NULL` ordering, `IS` comparison,
  `orderBy`/`limit`, and unique-key violations thrown as
  `LOCAL_DB_UNIQUE_VIOLATION` instead of silently overwriting. It is the adapter
  every repository test uses.
- Both adapters reject a nested transaction with `LOCAL_DB_NESTED_TRANSACTION`
  instead of silently flattening it.

### 6. Outbox (the queue contract, no engine yet)

- `outbox.repository.ts` is the interface (`enqueue`, `listByOwner`, `listPending`,
  `countPending`, `countConflicts`, `markSyncing`, `markFailed`, `markConflict`,
  `remove`, `reclaimInterrupted`, `getNext`); `local-outbox.repository.ts` plus
  `outbox.repository.helpers.ts`/`outbox.repository.writes.ts` implement it over
  the port.
- `outbox.coalescing.ts` owns the matrix: one row per `(ownerId, entityType,
  entityId)`, newest `localSnapshot` wins, `create + delete` cancels the row
  (nothing is sent), `delete + create` becomes an `update` (the server must never
  lose a record the user sees), the identity, `seq` and `baseRevision` are kept and
  `dependsOn` survives an edit that omits it. Coalescing is only allowed for
  `pending`/`failed` rows: `syncing` throws `OUTBOX_MUTATION_IN_FLIGHT` (the remote
  may already have applied it) and `conflict` throws
  `OUTBOX_CONFLICT_UNRESOLVED` (the evidence must survive until the user decides).
- `outbox-state.ts` is the explicit state machine
  (`pending → syncing|failed|conflict`, `syncing|failed → pending`, `conflict →
  pending`); an invalid transition throws `OUTBOX_INVALID_TRANSITION`.
- `outbox.ordering.ts` decides the next push: strictly `seq` order, only the head is
  a candidate, a `failed` head is eligible only at/after `nextAttemptAt` (`null`
  means permanent, manual retry only), and a head whose `dependsOn` entity is still
  queued blocks the whole queue (head-of-line blocking is intentional).
- `reclaimInterrupted(ownerId, now)` requeues rows a killed app left `syncing`,
  which is the only way a restart does not stall the queue.
- `outbox.mapper.ts` converts between rows and the `OutboxMutation` domain type; the
  single time source is a `now` parameter, never `Date.now()` inside the layer.

### 7. Sync bookkeeping and error codes

- `sync-state.repository.ts`: per-owner `lastPullAt`, `lastPushAt`,
  `lastFullSyncAt`, `lastErrorCode`; `get` never rejects for a missing row (all-null
  defaults) and `save` merges a partial patch, so the sync UI has a stable shape.
- `local-db.errors.ts`: `LOCAL_DB_MIGRATION_FAILED`, `LOCAL_DB_SCHEMA_NEWER`,
  `LOCAL_DB_NESTED_TRANSACTION`, `LOCAL_DB_UNIQUE_VIOLATION`,
  `OUTBOX_MUTATION_NOT_FOUND`, `OUTBOX_INVALID_TRANSITION`,
  `OUTBOX_MUTATION_IN_FLIGHT`, `OUTBOX_CONFLICT_UNRESOLVED`. `LocalDbError` carries
  a stable code only; no user-facing sentence leaves the layer.

### 8. One signed-amount implementation (prerequisite 3)

- The duplicate `getSignedTransactionAmount`/`getSignedTransactionAmountObj` in
  `features/transactions/repositories/transaction-firestore.utils.ts` were removed.
  `features/transactions/utils/transaction-balance.ts` is now the only
  implementation, and the create/update/delete operations import it; the update
  operation also reuses `applyTransactionUpdateToBalance` on the same-wallet branch
  instead of re-deriving the revert/apply pair.

### 9. Dependency

- `expo-sqlite@~58.0.15` added to `package.json`, matching
  `expo/bundledNativeModules.json`. **`npx expo install` fails in this environment**
  (corporate self-signed certificate), so the version was installed with
  `npm install expo-sqlite@~58.0.15`; the resolved version is the bundled one.
- `@react-native-community/netinfo` and `expo-crypto` were deliberately **not**
  added: neither has a consumer in this slice.

## Decisions

| Decision | Reason |
|---|---|
| Row-oriented `DatabasePort` instead of an execute/query SQL port | The in-memory adapter can implement the same contract, so Jest stays native-free and every repository is testable; SQL stays inside the SQLite adapter. |
| `outboxSeq` counter table | A depleting queue cannot keep `seq` monotonic with an autoincrement column; ordering across restarts is a product requirement, not a detail. |
| `outbox.operation` column | The coalescing matrix is undefined without it; deriving it from the payload would duplicate the rules. |
| Coalescing guarded by status | A `syncing` row may already be server-side and a `conflict` row is user evidence; both must be immutable to the enqueue path. |
| `dependsOn` preserved when an edit omits it | Re-editing a movement created offline must not detach it from its pending wallet. |
| `now` passed in, never read inside | Deterministic retry windows and reproducible tests for backoff. |
| `ON CONFLICT(<pk>) DO UPDATE` | `INSERT OR REPLACE` deletes the row, so omitted columns are lost and foreign side effects could fire. |
| `withExclusiveTransactionAsync` | Serializes local writers so a record + balance + outbox commit cannot interleave with another write. **Limitation:** it is not available on web, so the web adapter (or the web decision of Phase 7) needs its own strategy. |
| DDL + `user_version` in one transaction | A crash mid-migration leaves the previous version, never a half-applied schema. |
| In-memory parity for NULL ordering, `IS` and unique keys | A repository that passes in Jest and fails on the device is worse than no test. |

## Review findings and fixes

The slice went through `firebase-data` and a read-only `reviewer` pass that returned
**request changes**. Every blocker/major was fixed and re-verified before this doc
pass: transaction composition (optional `tx` on every write, nested transactions
rejected), coalescing restricted by status, monotonic `seq`, `INSERT OR REPLACE`
replaced by `ON CONFLICT`, exclusive transactions, retry window plus
`reclaimInterrupted`, `dependsOn` persistence, in-memory SQLite parity and the
migration transaction, plus a schema contract test that compares the DDL with the
key maps.

## Verification (24/11/2026)

- `npx tsc --noEmit`, `npx expo lint`, `npm run check:copy`: clean.
- `npm run test:coverage`: **397 suites / 2645 tests**, global **98.95 % statements,
  94.96 % branches, 98.72 % functions, 99.54 % lines**; `shared/lib/local-db`
  98.87 / 99.45 / 99.32 / 98.78.
- `expo-sqlite.database.ts` (16-line native factory) is uncovered by design: it
  cannot run without a device and it holds no logic.

## Deviations from the ADR

1. **Schema:** `outbox.operation` added and `outboxSeq` created (§4 and §5.1 of the
   ADR did not cover them); `conflicts(ownerId)` index added for the owner lookup.
2. **`transactions(ownerId, date)`** is declared without `DESC` (the ADR wrote
   `date DESC`); SQLite can scan an index in either direction, so behaviour is the
   same.
3. **Migration entry point:** `migrateLocalDatabase(port)` is independent of opening
   the database (ADR §3 sketched `database.ts` as "openDatabase + migrate on start").
   The lifecycle wiring lands with the first consumer.
4. **Signed-amount helper stays in `features/transactions/utils`.** ADR §11.3 and §6
   asked for a shared domain util, but `transaction-balance.ts` imports `roundMoney`
   from `features/wallets/utils/money`; moving it now would either create a
   `shared → features` import or force a `roundMoney` move across ~20 files that
   overlap with uncommitted work. **It must move in the Phase 4 slice that
   introduces the pending-delta calculation**, when both helpers are touched anyway.
5. **`expo-crypto` and `netinfo`** (ADR §11.4) are deferred to the slices that
   consume them, as decided with the user.

## Deliberately out of scope

Everything the epic still checks: client-generated ids for wallets, transactions and
categories (prerequisite 1); server `revision`/`deletedAt`/`appliedMutations` and
the rules that enforce them (prerequisite 2); the local read cache and offline
banner (phase 3); the offline write queue with local balance derivation (phase 4);
the sync engine, backoff and conflict UI (phase 5); offline social and group
movements (phase 6); offline UX, observability, account purge and the web decision
(phase 7). Also out: `shared/services/sync/`, `features/sync/`, feature-local
`local-*.repository.ts` implementations and the `offline_first` feature flag.

No `firestore.rules` or `firestore.indexes.json` change, so **there is nothing to
deploy** and no rule regression to validate.

## Known debt

- `features/transactions/repositories/transaction-update.operation.ts` is 178 lines,
  above the 150-line soft limit. The overage is pre-existing (182 lines before this
  slice; the shared-helper reuse in the same-wallet branch removed 4) and the
  remaining candidate split is the cross-wallet revert/apply block, deliberately not
  refactored here because it is a money path with no device validation available.
  Split it when that path is touched again.

## Pending manual steps

- **Native rebuild** is required the first time `expo-sqlite` is imported at
  runtime (Phase 3): development/production clients built before this dependency
  do not contain the native module. Nothing imports it today, so no rebuild is
  needed to keep working on the online app.
- No deploy, no device validation and no dark-mode check apply to this slice:
  nothing is wired to the UI.
