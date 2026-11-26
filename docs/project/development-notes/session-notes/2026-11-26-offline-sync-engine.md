# Offline sync engine, exactly-once and conflict UI (TICKET-023, slice 5)

> Date: 26/11/2026
> Status: Delivered — ADR §12 phase 5. TICKET-023 stays `🚧 In progress`.
> Related: `roadmap.md` Phase 7, `tickets/TICKET-023-FUTURE-OFFLINE-FIRST-SYNC.md`,
> the accepted ADR [`2026-11-14-offline-first-architecture.md`](2026-11-14-offline-first-architecture.md),
> the previous slices
> [`2026-11-24-offline-local-db-foundations.md`](2026-11-24-offline-local-db-foundations.md),
> [`2026-11-24-offline-revision-and-soft-delete.md`](2026-11-24-offline-revision-and-soft-delete.md),
> [`2026-11-24-offline-read-cache-and-banner.md`](2026-11-24-offline-read-cache-and-banner.md)
> and [`2026-11-26-offline-write-queue.md`](2026-11-26-offline-write-queue.md),
> `testing/test-guide.md`

## Context

Slices 1-4 built the local database, the write protocol, the read cache and the
local write queue. With the flag on, the outbox was never drained: nothing left
the device. This slice is ADR §12 phase 5 — **push, retry/backoff,
exactly-once and conflicts** — still behind `EXPO_PUBLIC_OFFLINE_FIRST` and
still scoped to personal expenses, incomes and transfers.

It closes the queue/sync/conflict requirements and six acceptance criteria of
the epic. Offline group/friend movements, the local recalculation of group
debts and the logout/account-switch purge remain open, so the epic is
`🚧 In progress`.

## Delivered

### 1. Engine (`shared/services/sync/`)

- `sync.push.ts` drains the outbox **strictly by `seq`** through
  `getNext(ownerId, now)`; the head-of-line row blocks the rest on purpose,
  because financial order matters more than throughput. `maxMutationsPerRun`
  defaults to 50. Each row is marked `syncing` (`markSyncing`, which also
  counts the attempt) before the executor is called.
- `sync.engine.ts` runs one push-then-pull cycle per account:
  `reclaimInterrupted` (rows left `syncing` by a crash) → optional
  `requeueFailed` when the run is manual → push → full pull unless the push
  stopped on a transient error. Runs are **single-flight per `ownerId`**: a
  second `sync()` call while one is running returns the same promise, so two
  triggers cannot push a row twice.
- `syncState` gets `lastPushAt` (only when something was pushed), `lastPullAt`,
  `lastFullSyncAt` and `lastErrorCode`; bookkeeping failures never fail the
  cycle.
- `backoff.ts` is exponential from 1 s to 5 min (±20 % jitter), with the
  attempt count already incremented.
- `sync.conflict-policy.ts` is the pure decision layer: available options per
  kind and a `ConflictResolutionPlan` (`requeue`/`applyRemote`/`removeLocal`/
  `markLocalSynced`).
- `sync-trigger.ts` is an in-process notification that a local write enqueued a
  mutation; it has exactly one subscriber (the sync provider).
- `firestore-idempotency.ts` owns the `appliedMutations` marker helpers used by
  the six online operations.

### 2. Triggers (`features/sync/hooks/use-sync-triggers.ts`)

One cycle is requested on: login/owner change, reconnection (skipped while
offline), app foreground (`AppState` → `active`), a **1.5 s debounce** after a
local write, a **5 min timer** while rows are pending, and the manual retry.
The runtime (`use-sync-runtime.ts`) also guards with a `running` ref, so a slow
cycle is never started twice from the UI.

### 3. Exactly-once in the online operations

- The six operations (`transactions` and `transfers`, create/update/delete)
  accept an optional `{ clientMutationId, baseRevision }`.
- When present, the operation writes
  `appliedMutations/{ownerId}__{clientMutationId}` **inside the same
  `runTransaction`** as the money change and the record, so the marker and the
  effect cannot diverge.
- A replayed id returns the stored record and its wallets without re-applying
  the effect: `applied` and `replayed` are both successes for the applier.
- Updates and deletes compare `baseRevision` with the stored `revision` and
  raise `REMOTE_CHANGED` on a mismatch. Deleting an already soft-deleted record
  succeeds (idempotent) instead of opening a conflict.
- Without `clientMutationId` the online path behaves as before, so the flag off
  is untouched.

### 4. Local database additions (`shared/lib/local-db/`)

- `conflict.repository.ts` + `conflict.mapper.ts`: open conflicts per owner,
  resolve them with the chosen decision, never auto-dismissed.
- `local-record-sync.ts` / `local-wallet-sync.ts`: mirror a server record, apply
  a remote snapshot, mark a record synced and update a wallet's
  `serverBalance` inside a caller transaction.
- Outbox additions: `rebase` (same payload on top of the remote revision,
  fresh retry state), `requeueFailed` (clear window and attempts for the manual
  retry) and `findById`.
- `serialized.database.ts`: `createSerializedDatabasePort` queues **every**
  local transaction process-wide through one promise chain, so a user write, a
  cache mirror and the sync applier can no longer interleave on the same port.

### 5. Feature wiring (`features/sync/`)

`firestore-sync-executor.ts` (per-entity modules
`firestore-transaction-mutations.ts` and `firestore-transfer-mutations.ts`),
`local-sync-applier.ts`, `local-conflict-resolver.ts`, `sync-pull.ts`,
`sync-overview.ts`, `sync-mutation-snapshots.ts` and `sync-engine.factory.ts`
build the engine, execute one mutation against Firestore, apply the result
locally, pull the personal collections (wallets, transactions, transfers) and
read the counters the UI shows.

### 6. UI (`features/sync/` + `app/sync.tsx`)

- `SyncStatusButton` lives in the four main tab headers (Inicio, Carteras,
  Movimientos and Social), left of the bell/requests/filters. It shows the
  no-signal icon while offline, the upload icon for pending changes and the
  alert icon for conflicts (conflicts win), with the pending + conflict badge;
  tapping it opens `/sync`. The old bottom strip, its offset helper and its copy
  were removed, so no screen is covered while reading or scrolling.
- Settings gains a **Sincronización** block (`SyncStatusBlock`) with the
  pending/conflict counts, the last sync time and **Reintentar ahora**.
- `/sync` is the sync center: status, last sync, error code, the conflict list
  and the same manual retry.
- The conflict bottom sheet compares **Tu cambio** with **Cambio de otro
  dispositivo**. `toSyncConflictView` builds the view model and resolves wallet
  **names** from the local cache (`readCachedWallets` in `use-sync-center.ts`),
  falling back to the wallet id when that wallet is not cached.
- ES/EN copy lives in `features/sync/locales/`; every action has a role, label
  and hint, and both schemes are themed with the shared tokens.

**UI revision (26/11/2026):** the first pass used a global pressable banner. It
was replaced by the header button above because the strip covered the tab bar
area and could not be dismissed; the context now also exposes `isOffline` so the
four headers share the single NetInfo subscription of the sync runtime. The
priority (conflicts → offline → pending) and the badge total live in the pure
`resolveSyncStatusIndicator`.

### 7. Rules

`transactions` and `transfers` split their read into `list` (owner-scoped
query) and `get` (signed-in). A missing-document `get` therefore resolves to
"not found" instead of `permission-denied`, which is what lets the executor
distinguish a remote delete from a permission error. `appliedMutations` is
unchanged from the second slice.

## Decisions

| Decision | Reason |
|---|---|
| A `clientMutationId` identifies one **immutable** payload | The marker is written once. Reusing an id for a different payload would make the server answer "already applied" and silently drop the new edit after a lost ack. |
| Coalescing always takes the **incoming** `clientMutationId` | Same rule: every payload is new, so it needs a new id. `seq`, `baseRevision` and `serverSnapshot` survive so the new payload is still guarded against concurrent edits. |
| A **create already attempted** coalesces as `update` (and a delete as `delete`) | The first attempt may have reached the server. Staying a `create` would collide with the existing document; an `update` reuses the revision guard and a real `delete` closes it. Before any attempt the plain matrix applies, including create+delete cancellation. |
| Deleting an already soft-deleted record is a success | The user's intent is satisfied; the server state is already the desired one. A conflict here would ask a question with no answer. |
| `markSyncing` increments `attempts` | The attempt is counted even when the app dies mid-push, so the backoff window reflects what was really sent. |
| A replay returns the stored record **and its wallets** | The applier needs the wallet state to refresh `serverBalance`; without it a replayed create would leave the cached balance stale until the next pull. |
| A cross-wallet edit returns **both** wallets | Moving a movement/transfer touches the origin and the destination; returning only one leaves the other `serverBalance` wrong until a pull. |
| Full pull after the push, still **no `onSnapshot`** | A full owner-scoped pull is enough for V1 and keeps one code path; listeners are phase 7. It also refreshes `serverBalance` with what the server really stored. |
| Resolved conflicts are kept as **audit** | The row stores the decision and its timestamp; the queue only reads open conflicts, so history stays available without blocking. |
| Local transactions are serialized process-wide | A user write, a cache mirror and the engine share one SQLite port; queueing removes the phase-4 `LOCAL_DB_NESTED_TRANSACTION`/`SAVE_FAILED` class instead of retrying it. |

## Review findings and fixes

The read-only `reviewer` returned `changes requested`.

**Blocker:** coalescing reused the previous `clientMutationId`, so a later edit
coalesced into an attempted create could be reported as already applied and be
silently dropped. Fixed with the immutable-payload rule above (a fresh id per
payload, and the attempted-create matrix).

**Majors:**

1. A create could collide with an existing document; an attempted create now
   coalesces as `update`.
2. Deleting an already soft-deleted record opened a conflict; it is now an
   idempotent success.
3. A replay returned no wallets, leaving `serverBalance` stale; outcomes now
   carry them.
4. A cross-wallet edit returned only one wallet, leaving the origin
   `serverBalance` stale; both are returned.

Plus nits 6, 10 and 12: an explicit `stop`/`transient` push result (so the pull
is skipped only on connectivity errors), the remote wallet `updatedAt` written
with the remote snapshot, and a retry when a conflict snapshot cannot be read.

Nits 7, 8, 9 and 11 are accepted and recorded as limitations below.

## Verification (26/11/2026)

- `npx tsc --noEmit`, `npx expo lint` and `npm run check:copy`: clean (355 TSX).
- `npx jest`: **459 suites / 3098 tests** (the two banner test files were
  replaced by the seven `sync-status-indicator` cases).
- `npm run test:coverage`: global **98.65 % statements, 94.67 % branches,
  98.5 % functions, 99.22 % lines**; `shared/services/sync`
  97.48/97.26/100/97.33 and `features/sync/services`
  97.47/91.46/96.87/97.89.
- `npx firebase deploy --only firestore:rules --dry-run` compiles.

## Deviations

1. **ADR §7 planned full pull plus `onSnapshot` listeners.** This slice ships
   the pull only; listeners wait for phase 7, which also decides the staleness
   marker of the cached lists.
2. **The conflict sheet reads wallet names from the local cache**, not from the
   remote snapshot. It is one indexed local read shared by every conflict, and
   a wallet that is not cached falls back to its id instead of blocking the
   sheet.
3. **No schema migration and no new dependencies.** The `conflicts`,
   `syncState` and outbox tables already had every column this slice needs.
4. **`appliedMutations` rules did not change**; the marker contract came with
   the second slice.

## Known limitations

- **Pull is per collection.** `pullOwnerData` reads the three personal
  collections and mirrors each one in its own local transaction, so consistency
  is per collection: a record can briefly reference a wallet the pull has not
  refreshed yet. There is no cross-collection snapshot in this phase.
- **The 5 min timer and the pending counter include `failed` rows.** A failed
  row waits for its window or for **Reintentar ahora**; it is counted as
  pending, so an actionable failure is never hidden.
- **Wallet names in the conflict sheet come from the local cache.** A wallet
  that is not cached (for example one created on another device and not pulled
  yet) is shown by its id.
- **`permission-denied` remains a permanent failure.** It is not retried
  automatically; the user fixes the cause and uses the manual retry. This is
  deliberate: a permission error is not connectivity.
- **A local write can still hit a row the engine marked `syncing`.** If the
  enqueue finds that state it fails with `OUTBOX_MUTATION_IN_FLIGHT`
  (abortive, no corruption) and the user retries; serialization removes the
  transaction interleaving, not this state race.
- **No full device validation yet.** The SQLite adapter and the conflict sheet
  cannot be exercised in Jest; the header icon and the offline dashboard were
  checked on a device, but offline writes, exactly-once and two-device conflicts
  are still pending.

## Pending manual steps

1. **Deploy the rules before enabling the flag.** The `transactions`/`transfers`
  `get`/`list` split is new in this slice and the `appliedMutations` contract
  came with the second slice; the existing rules are older than both.
2. Set `EXPO_PUBLIC_OFFLINE_FIRST=true` and restart the bundler: the value is
  inlined at build time, so a running Metro keeps the old one.
3. Native rebuild only if the installed client predates `expo-sqlite` and
   `netinfo`.
4. Device walkthrough: airplane mode → create/edit/delete an expense, an income
  and a transfer → kill and relaunch → reconnect, and confirm in the console
  that each mutation is applied exactly once. The full checklist lives in `testing/test-guide.md` §11.
5. Two-device conflicts: edit the same movement on both, verify the sheet, and
  exercise **keep mine** and **keep remote** (including a remote delete).
6. Retry after a permanent failure and after a transient one, then the light
  and dark schemes on the header icon, Settings, `/sync` and the sheet.
