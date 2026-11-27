# [DONE] TICKET-023 - Future Epic: Offline-First and Sync

**Type:** Epic / Architecture  
**Priority:** High  
**Status:** ✅ Done (27/11/2026)  
**Design spike:** ✅ Accepted (14/11/2026) — implementation completed 27/11/2026 (foundations, prerequisites, read cache, write queue, sync engine, offline social movements, account purge, offline UX and web decision)  
**Related:** PM-023; TICKET-002, TICKET-003, TICKET-007, TICKET-009, TICKET-010  
**Sprint:** Platform / Post-MVP  

## Description
Make the app usable without an internet connection. The user must be able to create expenses, incomes, transfers and shared movements while offline, see the changes immediately, and sync them with Firebase when connectivity returns.

## Requirements
- [x] Choose the local persistence and sync architecture before implementation — decided on 14/11/2026 (see **Design Spike**)
- [x] Persist wallets, transactions, transfers, categories, friends, groups, shared expenses and settlements locally
- [x] Allow creating, editing and deleting expenses/incomes and transfers while offline
- [x] Allow creating group expenses and settlements while offline
- [x] Queue offline mutations with idempotency keys, retry and backoff
- [x] Sync on app start and on reconnect, preserving mutation order and dependencies
- [x] Recalculate wallet balances and group debts locally with the same rules as the online path
- [x] Define conflict resolution for edits made on multiple devices
- [x] Surface conflicts to the user instead of silently overwriting money data
- [x] Show offline state, pending changes, last sync time and a manual retry action
- [x] Clear or isolate local data on logout and account switching
- [x] Add unit tests for the queue/conflict logic and integration tests for offline -> online flows

## Acceptance Criteria
- [x] Creating an expense, income or transfer offline works and survives an app restart
- [x] Reconnecting syncs each queued mutation exactly once, with no duplicates
- [x] Offline group/friend movements sync and balances remain correct
- [x] A conflicting edit is reported and never silently discards one user's data
- [x] The user can see what is pending and retry a failed sync
- [x] The app remains usable when Firebase is temporarily unavailable
- [x] Logging out removes local access to the previous account's data
- [x] Existing online behaviour and balance rules do not regress

## Progress (24/11/2026)

### First slice — prerequisites 3-5 of ADR §11 (technical base)

No requirement or acceptance criterion above is closed by it, and the epic
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

**Verification:** `npx tsc --noEmit`, `npx expo lint` and `npm run check:copy` clean;
`npm run test:coverage` → 397 suites / 2645 tests, global 98.95 % statements,
94.96 % branches, 98.72 % functions, 99.54 % lines. No `firestore.rules` or index
change, so nothing to deploy and nothing to validate on a device yet.

**Detail:** [`session-notes/2026-11-24-offline-local-db-foundations.md`](../development-notes/session-notes/2026-11-24-offline-local-db-foundations.md)

### Second slice — prerequisites 1-2 of ADR §11 (24/11/2026)

Every epic checkbox still stays open; this slice only prepares the write protocol.

**Delivered:** `shared/utils/revision.ts` (`INITIAL_REVISION = 0`,
`readStoredRevision` with a legacy default of 0 and `nextRevision`) and
`shared/utils/client-id.ts`; `revision: number` on `Wallet`, `Transaction`,
`Transfer` and `Category` with the mappers defaulting legacy documents to 0; every
create writes 0 and every update writes stored + 1 (personal operations, linked
movements, settlements, group expenses/settlements, wallet reassignment/orphan,
category reorder and seeding). The four create DTOs accept an optional client `id`,
so Phase 4 can fix the document id before the local write. Transactions moved to
soft delete (`deletedAt` + revision +1 + exactly-once balance revert): the personal
delete is idempotent, rejects linked movements with `TRANSACTION_INVALID` and
rejects editing a deleted movement with `TRANSACTION_NOT_FOUND`; the movements list
already filtered `deletedAt`. `wallet-movements` excludes soft-deleted movements from
the usage count and the reassignment net, and `category-usage` counts only active
movements. Rules: `isRevisionBump`/`isInitialRevision` on the four collections,
`transactions` hard delete denied, and an owner-only, append-only
`appliedMutations/{ownerId}__{clientMutationId}` contract (the executor writes it in
Phase 5). An independent review returned `changes requested`; the blocker (editing a
soft-deleted movement re-applied its amount) and the majors (wallet-deletion
predicate, negative stored revision, returned entity revision) were fixed.

**Verification:** `npx tsc --noEmit`, `npx expo lint` and `npm run check:copy` clean
(343 TSX files); `npx jest` → 401 suites / 2687 tests; `npm run test:coverage` →
98.94 % statements, 95.01 % branches, 98.74 % functions, 99.53 % lines; the rules
compile in dry-run.

**Pending:** deploy the new rules and validate the flows on a device. No index
change.

**Detail:** [`session-notes/2026-11-24-offline-revision-and-soft-delete.md`](../development-notes/session-notes/2026-11-24-offline-revision-and-soft-delete.md)

### Third slice — local read cache and offline banner (24/11/2026)

Every epic checkbox stays open; this slice only makes the last online read
readable without a connection.

**Delivered:** schema v2 (`migrations/migration-002.ts`) with the four movement
link ids, the transfer wallet display names, the `cacheMeta` table and a rebuild
of `categories` so `sortOrder` is nullable (v1 declared it `NOT NULL`, which only
fails on a device because `InMemoryDatabase` does not enforce it); the cache
infrastructure (`cache-mirror.ts` with protected rows, `cache-meta.repository.ts`,
`local-row.readers.ts`, `local-db.runtime.ts` as the memoized port and the only
`expo-sqlite` importer through a dynamic `import()`, and `offline-first.flag.ts`
reading `EXPO_PUBLIC_OFFLINE_FIRST`); and three files per personal feature
(`local-<entity>.mapper.ts`, `local-<entity>.cache.ts`,
`cached-<entity>.repository.ts`) for wallets, categories, movements and
transfers. `use-async-collection` paints the cached list first and replaces it
with the remote result, keeps cached data when the remote read fails and keeps
today's behaviour on a cold cache; the four hooks and service factories wire it
only when the flag is on. Movement and transfer mutations mirror their record
after create/update/delete and the cached reads filter `deletedAt`, so a deleted
record never reappears; wallet and category mutations are not mirrored (phase 4).
New `features/sync/` adds the three-state network status, the offset helpers and
the global bottom `OfflineBanner` (`Sin conexión · Mostrando datos guardados`),
rendered in `app/_layout.tsx` as a sibling of the navigator.
`@react-native-community/netinfo@12.0.1` was added with `npm install`.

**Review:** the read-only `reviewer` returned `changes requested` with one blocker
(`categories.sortOrder` written as `NULL` into a `NOT NULL` column), two majors
(soft-deleted records served by the cache, cache not updated after a mutation) and
minor findings. All were fixed and re-verified; the accepted nits are the brittle
`TAB_BAR_HEIGHT`/`TAB_ROUTES` coupling and the cached list not being marked stale
(phase 7).

**Verification:** `npx tsc --noEmit`, `npx expo lint` and `npm run check:copy`
clean (346 TSX); `npx jest` → 426 suites / 2832 tests; `npm run test:coverage` →
98.90 % statements, 95.00 % branches, 98.64 % functions, 99.48 % lines
(`shared/lib/local-db` 97.57 / 97.34 / 97.66 / 97.76 and `features/sync/utils`
100 %; `local-db.runtime.ts` stays partial because the dynamic `expo-sqlite` path
cannot run in Jest). No `firestore.rules` or index change.

**Pending:** a native rebuild before enabling the flag (first runtime use of
`expo-sqlite` and `netinfo`), `EXPO_PUBLIC_OFFLINE_FIRST=true` plus a bundler
restart (the value is inlined), and device validation of airplane mode after one
online load, app kill/relaunch offline, reconnect, the strip on tabs vs pushed
routes and dark mode.

**Detail:** [`session-notes/2026-11-24-offline-read-cache-and-banner.md`](../development-notes/session-notes/2026-11-24-offline-read-cache-and-banner.md)

**Next slice:** offline write queue for expenses, incomes and transfers with
local balance derivation (ADR phase 4).

### Phase 3 device fixes (25/11/2026)

The first physical-device run (dark mode) found two defects:

1. The bottom strip was unreadable because `warningSurface` is a translucent
   amber in dark mode; it now uses a solid `warning` background with a computed
   foreground (`background` in dark mode, `onPrimary` in light mode).
2. **An offline read wiped the cache.** Firestore `getDocs` resolves with an empty
   cached snapshot (`size = 0`, `metadata.fromCache = true`) instead of rejecting;
   the mirror deleted every row and the screens showed empty states. New
   `shared/lib/local-db/offline-read.ts` (`assertServerSnapshot`) makes the four
   list reads reject a cached **empty** snapshot with `OFFLINE_READ`; cached
   snapshots with documents are still accepted. Not behind the feature flag:
   serving an empty list for an unreachable server is wrong in both modes.
3. **The lists did not reload when the connection returned.** `useAsyncCollection`
   gained `refreshOnReconnect`: the shared `useNetworkStatus` hook reports the
   offline→online transition and the collection refreshes once, so the remote read
   replaces the cached data. Only subscribes while `EXPO_PUBLIC_OFFLINE_FIRST` is
   enabled; phase 5 replaces it with the sync engine's pull.
4. **Dev-only LogBox toasts over the app.** The Firestore connection warnings of
   every offline launch were rendered by LogBox as white toasts (unreadable in
   dark mode, sometimes two at once). `app/_layout.tsx` ignores the four Firestore
   connection patterns under `__DEV__`; release builds never showed them.

**Verification:** `npx tsc --noEmit`, `npx expo lint` and `npm run check:copy`
clean; `npx jest` → 427 suites / 2838 tests; `npm run test:coverage` → 98.90 %
statements, 95.01 % branches, 98.64 % functions, 99.48 % lines.

**Pending:** repopulate the cache with one online load and repeat the
airplane-mode walkthrough (the device had no internet during validation).

**Detail:** [`session-notes/2026-11-24-offline-read-cache-and-banner.md`](../development-notes/session-notes/2026-11-24-offline-read-cache-and-banner.md)

### Fourth slice — offline write queue (ADR phase 4, 26/11/2026)

Every epic checkbox stays open: the queue is local-only until the phase-5 sync
engine drains it, and the flag is a development switch.

**Delivered:** `roundMoney` and the signed balance helpers moved to
`shared/utils/money.ts` and `shared/utils/transaction-balance.ts` (ADR §11.3);
`shared/lib/local-db/pending-balance.ts` derives the per-wallet pending delta
from the outbox snapshots with the create/update/delete matrix (pending,
syncing, failed and conflict rows included; malformed snapshots ignored);
`IOutboxRepository.find` and owner reads inside a caller transaction; the local
write repositories `OfflineTransactionRepository` and
`OfflineTransferRepository` write the record and one coalesced outbox row in a
single local transaction, keep the local revision at the server-known value,
preserve `baseRevision`/`serverSnapshot` when coalescing, cancel a create+delete
without sending it, soft-delete, reject linked movements and edit orphan `-1`
movements with online parity; transfers validate self-transfer, ownership,
currency, amount and the **derived** funds inside the same transaction with the
previous effect added back, and `getTransfer` reads the local row first. Wallet
rows are never rewritten: `local-wallet.balances.ts` recomputes
`serverBalance + delta` on every read, `CachedWalletRepository` mirrors the
server list and returns the derived cache (falling back to it when the remote
read fails), `CachedCategoryRepository.getCategory` resolves from the cached
list by id or `legacyId`, and cached list reads return local rows even without
`cacheMeta`. Factories wire it only with `EXPO_PUBLIC_OFFLINE_FIRST`; both
mutation hooks share `useSingleFlightMutation`, so a double tap cannot open two
writes. No schema, rules, index or document change.

**Review:** the first pass returned `changes requested` (orphan `-1` edit parity
and local transaction concurrency on a double tap); both fixed. The second pass
returned `approve with nits` (150-line limit in the hooks, duplicate-id guard by
real primary key, trim-safe orphan check, idempotent delete without an extra
outbox read); all fixed.

**Verification:** `npx tsc --noEmit`, `npx expo lint` and `npm run check:copy`
clean (346 TSX); `npx jest` → 440 suites / 2952 tests; `npm run test:coverage` →
98.92 % statements, 95.07 % branches, 98.69 % functions, 99.46 % lines.

**Pending:** push/pull, retry/backoff, exactly-once (`appliedMutations`),
conflicts and the sync UI are phase 5/7. With the flag on the outbox is not
drained, so nothing is sent to Firestore (set `EXPO_PUBLIC_OFFLINE_FIRST=false`
for normal online use until phase 5). Residual limitation: a user write can
still overlap a cache-mirror transaction on the same local port and surface
`LOCAL_DB_NESTED_TRANSACTION`/`SAVE_FAILED` (abortive, no money corruption);
phase 5 owns serialization. Device validation of airplane-mode
create/edit/delete plus restart is pending.

**Detail:** [`session-notes/2026-11-26-offline-write-queue.md`](../development-notes/session-notes/2026-11-26-offline-write-queue.md)

### Fifth slice — sync engine, retry, exactly-once and conflict UI (26/11/2026)

This slice closes the queue/sync/conflict requirements and the six acceptance
criteria marked above. The epic stays `🚧 In progress` for offline
group/friend movements, the local recalculation of group debts and the
logout/account-switch purge.

**Delivered:** `shared/services/sync/` (error classification transient/conflict/permanent, exponential backoff 1 s→5 min ±20 % jitter, pure conflict policy with keep-mine/keep-remote plans, push loop, single-flight engine, sync trigger, Firestore idempotency helpers `appliedMutations`); `shared/lib/local-db/` (conflicts repository + mapper, record/wallet sync helpers, `serialized.database.ts` that queues every local transaction so user writes, cache mirrors and the engine cannot overlap, outbox `rebase`/`requeueFailed`/`findById`); idempotency in the six online operations (transaction/transfer create/update/delete accept `{clientMutationId, baseRevision}` and write the marker atomically; replay returns the stored record and its wallets; base revision guard; delete of an already soft-deleted record succeeds); coalescing now issues a **fresh** `clientMutationId` per payload and converts an attempted create into update/delete; `markSyncing` counts the attempt; `features/sync/` (Firestore executor + per-entity mutation modules, local applier, conflict resolver, full pull, overview, engine factory); a conflict view model (`toSyncConflictView`) that resolves wallet **names** from the local cache (`readCachedWallets`) with the wallet id as the fallback when it is not cached; UI (a header sync button in Inicio, Carteras, Movimientos and Social, left of the bell/requests/filters, with the pending/conflict badge and a link to `/sync`; Settings **Sincronización** block with manual retry; `/sync` center; conflict bottom sheet "Tu cambio" vs "Cambio de otro dispositivo"; ES/EN copy; dark mode); rules: `transactions`/`transfers` read split into `list` + `get` (a missing-document `get` resolves to not-found), `appliedMutations` unchanged.

**UI revision (26/11/2026):** the pressable bottom banner of the first pass was removed. The sync state lives in a `SyncStatusButton` (shared `IconBadgeButton`) in the four main tab headers: conflicts win, then offline (`cloud-offline-outline`), then pending (`cloud-upload-outline`); the badge counts pending + conflicts and tapping opens `/sync`. The strip, its offset helper and its copy were deleted, so no screen is covered while scrolling. `check:copy` → 355 TSX; `npx jest` → **459 suites / 3098 tests** (two banner test files removed, one indicator test added).

**Exactly-once:** marker `appliedMutations/{ownerId}__{clientMutationId}` written in the same `runTransaction` as the money change; a replay returns the stored state and its wallets without re-applying; `clientMutationId` is immutable per payload (coalescing always issues a new one); updates/deletes compare `baseRevision` with the stored `revision`.

**Retry:** transient (`unavailable`, `deadline-exceeded`, `network-request-failed`, `resource-exhausted`, `aborted`) pauses the queue with `nextAttemptAt`; conflicts and permanent errors stop it until the user acts; **Reintentar ahora** requeues `failed` rows and clears their window; `syncing` rows left by a crash are reclaimed.

**Conflicts:** kinds `REMOTE_CHANGED`, `DELETED_REMOTELY`, `WALLET_UNAVAILABLE`, `INSUFFICIENT_FUNDS`, `INVALID`; keep-mine rebases to the remote revision (or re-creates after a remote delete); keep-remote applies the remote snapshot or removes the local row; resolution writes record + outbox + conflict in one local transaction; open conflicts block the queue.

**Review:** the read-only `reviewer` returned `changes requested` (1 blocker: coalescing reused the mutation id and could silently drop a later edit after a lost ack; 4 majors: create collision, delete of an already-deleted record opening a conflict, replay without wallets, cross-wallet edit leaving the origin `serverBalance` stale). All five fixed plus nits 6, 10 and 12 (explicit stop/transient push result, remote wallet `updatedAt`, retry when a conflict snapshot cannot be read). Nits 7, 8, 9 and 11 are accepted and documented as limitations.

**Verification (26/11/2026):** `npx tsc --noEmit`, `npx expo lint` and `npm run check:copy` clean (355 TSX); `npx jest` → **459 suites / 3098 tests**; `npm run test:coverage` → global **98.65 % statements, 94.67 % branches, 98.5 % functions, 99.22 % lines** (`shared/services/sync` 97.48/97.26/100/97.33 and `features/sync/services` 97.47/91.46/96.87/97.89); `npx firebase deploy --only firestore:rules --dry-run` compiles.

**Pending manual steps:** deploy the new rules (`transactions`/`transfers` get split + `appliedMutations` from the second slice) **before** enabling the flag; set `EXPO_PUBLIC_OFFLINE_FIRST=true` and restart the bundler (the value is inlined); native rebuild only if the installed client predates `expo-sqlite`/`netinfo`; device validation of airplane mode → create/edit/delete → kill/relaunch → reconnect, exactly-once in the console, two-device conflicts and both resolutions, retry after a permanent failure, light/dark mode.

**Detail:** [`session-notes/2026-11-26-offline-sync-engine.md`](../development-notes/session-notes/2026-11-26-offline-sync-engine.md)

### Sixth slice — offline group and friend movements (26/11/2026)

This slice closes the local persistence of social data, the offline
create/edit/delete of the four social movement types, their sync and the local
wallet/ledger derivation, with the three requirements and the one acceptance
criterion marked above. The epic stays `🚧 In progress` for the logout and
account-switch purge, the offline UX/observability work and the web decision.

Scope agreed with the user: **full movement parity** and **no offline group
creation** — creating a group, inviting, joining and friend management stay
online-only.

**Delivered:** schema v3 (`migrations/migration-003.ts`) with nine social tables
(`friendships`, `friendRequests`, `publicProfiles`, `groups`, `groupInvitations`
and the four movements), all scoped by `ownerId` and keyed by `(ownerId, id)` so
two accounts can cache the same shared document; `LocalCacheCollection`,
`OutboxEntityType` (`shared-expense`, `settlement`, `group-expense`,
`group-settlement`) and `LOCAL_DB_PRIMARY_KEYS` extended, with the outbox and
conflict mappers knowing the new entity types; a social read cache (mapper,
cache and cached repository per entity, `social-cache.ts`, a scoped
`mirrorOwnerRows`, cache-first reads with remote refresh, `assertServerSnapshot`
on the social lists and an empty-list fallback for requests and invitations);
`sync-social-pull.ts`, which pulls friendships, requests, profiles, groups, the
shared expenses, the settlements and every group's expenses and settlements
after the personal pull (`pullGroupMovements` with `Promise.allSettled`);
`revision` and idempotency in the four social create/update/delete operations and
their linked variants (`appliedMutations` inside the same transaction, replay
without re-applying, `baseRevision` guard, `DELETED_REMOTELY` on a stale soft
delete and the notification stored in the outbox snapshot); local write
repositories backed by `social-write.ts` (record + coalesced outbox row in one
local transaction, create+delete cancellation, server-known revision); a pending
wallet delta for linked social movements (`pending-balance.snapshots.ts` plus the
existing `pending-balance.ts` matrix), so the displayed balance already includes
a queued social movement or link change; executor modules for the four social
types that always call the **linked** update/delete and return no wallets (the
following pull refreshes `serverBalance`); a conflict view that understands
`amountCents`, `description`/`note` and `receiverWalletId`; factories wiring
`Offline(Cached(Firebase))` for the four movements, groups, friends and the
friend ledger behind `EXPO_PUBLIC_OFFLINE_FIRST`. Rules: `revision` bumps on the
four collections, the field/diff allowlists include it, `appliedMutations`
accepts the four social entity types, and `get` was split from `list` so a
missing document resolves to not-found instead of permission-denied.

**Scope decision:** no offline group creation (creating a group, inviting,
joining and friend management stay online); the movement parity is the phase-6
exit criterion.

**Review:** the first read-only pass returned `changes requested` for a stale
`deletedAt` gap (an edit over a record deleted on another device passed the local
snapshot and was denied as a permanent error); fixed in the four update paths
with `DELETED_REMOTELY`/`ALREADY_DELETED`. The second pass returned `approve with
nits`; the two actionable nits were fixed (a replayed group-settlement update no
longer rewrites its notification, and an already-deleted delete stores the
stored revision instead of the next one). The pre-existing block on deleting a
group expense whose payer left the group stays a documented limitation.

**Verification (26/11/2026):** `npx tsc --noEmit`, `npx expo lint` and
`npm run check:copy` clean (357 TSX); `npx jest` → **469 suites / 3195 tests**;
`npm run test:coverage` → global **96.53 % statements, 90.23 % branches, 97.52 %
functions, 97.55 % lines**; `npx firebase deploy --only firestore:rules --dry-run`
compiles (nothing deployed).

**Still open:** the logout/account-switch purge, the offline UX/observability
work and the web offline decision (ADR phase 7); the new rules and the social
flows still need a device walkthrough.

**Detail:** [`session-notes/2026-11-26-offline-social-movements.md`](../development-notes/session-notes/2026-11-26-offline-social-movements.md)

### Seventh slice — offline UX, observability, account purge and web decision (27/11/2026)

This slice closes the last open requirement and the last open acceptance
criterion: `Clear or isolate local data on logout and account switching` and
`Logging out removes local access to the previous account's data`. With them the
epic is complete.

**Delivered:**

- **Account purge on logout and switch.** `purgeOwnerLocalData`
  (`shared/lib/local-db/owner-purge.ts`) deletes the owner's rows from the 18
  tables that declare `ownerId` — the personal and social records, `outbox`,
  `conflicts`, `syncState`, `cacheMeta` and `outboxSeq` — inside one local
  transaction, so a logout never leaves a half-purged account. The outbox and the
  open conflicts of that account go with the data.
- **Revocation before logout.** `owner-revocation.ts` marks the account as
  revoked **before** `signOut` is called, so an in-flight read cannot repopulate
  the cache between the purge and the auth change. If `signOut` fails the
  revocation is restored (the account keeps its local data and stays usable), and
  a successful login lifts the revocation, so the same account works again.
- **Engine guard.** The sync engine is single-flight per account and refuses to
  start for a revoked account; the runtime therefore cannot push or pull rows
  after the account was revoked.
- **Warning with fresh data.** Logging out with local data present reads the
  overview again (pending and conflicts) instead of trusting the rendered state,
  and asks for confirmation when changes are pending or conflicted.
- **Manual purge.** `Borrar datos locales` in the Settings **Sincronización**
  block purges the account whose session is active, with confirmation, and
  re-activates it so the app keeps working in the same session; when there is no
  local database it reports `localData.unavailable` instead of failing silently.
- **Context refresh.** The sync context exposes `refresh`, so the overview is
  re-read after a purge, a retry or a logout attempt without remounting the
  provider.
- **Web decision.** `isOfflineFirstEnabled()` returns `false` when
  `Platform.OS === "web"`, so web stays online-only even with
  `EXPO_PUBLIC_OFFLINE_FIRST=true`. Future parity is tracked in TICKET-076.
- **Hardening.** `mirrorSingleRow` filters by `ownerId`, the flag reader no
  longer latches a failure, and a contract test compares
  `OWNER_SCOPED_LOCAL_TABLES` with the schema tables that declare `ownerId`, so a
  new table cannot silently escape the purge. The revocation and purge tests
  include the social case (a shared document owned by two accounts) and restore
  their mocks.

**Isolation decision:** rows stay scoped by `ownerId` and are physically purged
for that owner on logout; the local database is never shared or "handed over"
between accounts. The purge is transactional and idempotent, and the manual
action reuses it. The web build keeps the online path (TICKET-076).

**Review:** the read-only `reviewer` returned `approve with nits`, with no
blockers and no majors. Minors 2-6 and nits 3 and 6 were applied.

**Accepted debt:**

- The new hooks (`use-settings-logout`, `use-local-data-purge`) have no unit test:
  there is no React renderer and hooks are outside the coverage gate.
- The `Modal` + `ConfirmDialog` pattern is duplicated between Settings and the
  sync block; it is small and stable.
- Device and dark-mode validation of the new surfaces is still pending.

**Verification (27/11/2026):** `npx tsc --noEmit` clean; `npx expo lint` clean;
`npx jest` → **475 suites / 3235 tests**; `npm run test:coverage` → global
**96.56 % statements, 90.26 % branches, 97.54 % functions, 97.56 % lines**;
`npm run check:copy` → **359 TSX**. No change to `firestore.rules`, indexes,
mappers or money arithmetic, so there is nothing new to deploy from this slice.

**Pending manual steps (not blocking this closure):** deploy the rules of the
previous slices **before** enabling the flag, and walk the §11 checklist of
`test-guide.md` on a device, including logout purge, **Borrar datos locales** and
web online-only.

**Detail:** [`session-notes/2026-11-27-offline-account-purge-and-web-decision.md`](../development-notes/session-notes/2026-11-27-offline-account-purge-and-web-decision.md)

## Implemented (27/11/2026)

The epic delivers an offline-first client behind `EXPO_PUBLIC_OFFLINE_FIRST`
(default off): SQLite as the on-device store, a coalesced outbox per account, a
single-flight sync engine with exponential backoff and exactly-once
`appliedMutations` markers, revision-based conflicts with an explicit resolution
UI and a local read cache for personal and social data, plus per-account purge
and the web online-only decision.

Files touched by the closing slice:

- `shared/lib/local-db/owner-purge.ts`, `owner-revocation.ts`,
  `cache-mirror.ts`, `offline-first.flag.ts`
- `shared/services/sync/sync.engine.ts`, `shared/services/sync/single-flight.ts`
- `features/sync/services/account-local-data.ts`,
  `features/sync/providers/sync-context.ts`,
  `features/sync/hooks/use-sync-runtime.ts`,
  `features/sync/hooks/use-local-data-purge.ts`,
  `features/sync/components/sync-status-block.tsx`,
  `features/sync/components/sync-local-data-action.tsx`,
  `features/sync/locales/{es,en}.json`
- `features/settings/hooks/use-settings-logout.ts`,
  `features/settings/components/settings-screen.tsx`,
  `features/settings/components/settings-logout-section.tsx`,
  `features/settings/locales/{es,en}.json`
- `features/auth/providers/auth-provider.tsx`,
  `features/auth/repositories/auth.repository.ts`,
  `features/auth/repositories/firebase-auth.repository.ts`,
  `features/auth/services/auth.service.ts`, `features/auth/services/auth.factory.ts`
- Colocated `__tests__/` for the new modules.

## Design Spike (14/11/2026)

**Status:** ✅ Accepted (14/11/2026) and implemented on 27/11/2026.
The decisions below were delivered in the phases listed in *Delivery phases*.

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
| 2 | Local DB foundations, client ids, `revision`/`deletedAt`/`appliedMutations` + rules | Phase 7 ✅ 24/11/2026 |
| 3 | Local read cache for personal data | Phase 7 ✅ 24/11/2026 |
| 4 | Offline write queue for expenses, incomes and transfers | Phase 7 ✅ 26/11/2026 |
| 5 | Sync engine, retry, exactly-once and conflicts | Phase 7 ✅ 26/11/2026 |
| 6 | Offline group/friend movements | Phase 7 ✅ 26/11/2026 |
| 7 | Offline UX, observability, account purge and web decision | Phase 7 ✅ 27/11/2026 |

### Acceptance criteria mapping

| Acceptance criterion | Phase |
|---|---|
| Offline create survives an app restart | 4 |
| Exactly-once sync on reconnect | 5 |
| Offline group/friend movements keep balances correct | 6 |
| Conflicting edit reported, never silently discarded | 5 |
| User sees pending changes and can retry a failed sync | 5 (header icon; basic strip in 3) |
| App usable while Firebase is unavailable | 3-4 |
| Logout removes local access to the previous account's data | 7 (delivered 27/11/2026) |
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

