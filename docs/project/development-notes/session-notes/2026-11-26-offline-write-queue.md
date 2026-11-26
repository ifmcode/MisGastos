# Offline write queue and local balance derivation (TICKET-023, slice 4)

> Date: 26/11/2026
> Status: Delivered — ADR §12 phase 4. TICKET-023 stays `🚧 In progress`.
> Related: `roadmap.md` Phase 7, `tickets/TICKET-023-FUTURE-OFFLINE-FIRST-SYNC.md`,
> the accepted ADR [`2026-11-14-offline-first-architecture.md`](2026-11-14-offline-first-architecture.md),
> the previous slices
> [`2026-11-24-offline-local-db-foundations.md`](2026-11-24-offline-local-db-foundations.md),
> [`2026-11-24-offline-revision-and-soft-delete.md`](2026-11-24-offline-revision-and-soft-delete.md)
> and [`2026-11-24-offline-read-cache-and-banner.md`](2026-11-24-offline-read-cache-and-banner.md),
> `testing/test-guide.md`

## Context

Slices 1-3 delivered the local database, the write protocol and the read cache.
This slice is ADR §12 phase 4: **local writes for expenses, incomes and
transfers plus local balance derivation**, behind the same
`EXPO_PUBLIC_OFFLINE_FIRST` flag. Creating, editing and deleting a personal
movement or a transfer now writes the SQLite row and the outbox row in one local
transaction, so the change survives an app restart.

The push does **not** exist yet. With the flag on, nothing leaves the device: the
outbox is never drained until the phase 5 sync engine lands. No epic requirement
or acceptance criterion is closed by this slice; the sync engine, retry/backoff,
exactly-once markers, conflict UI, offline social and the offline UX are still
pending.

## Delivered

### 1. Shared money and balance helpers (ADR §11.3)

- `shared/utils/money.ts` owns `roundMoney` (moved out of
  `features/wallets/utils/money.ts`, which keeps formatting and totals and
  imports it from shared).
- `shared/utils/transaction-balance.ts` owns the signed amount and the balance
  operations: `getSignedTransactionAmount`,
  `applyTransactionToBalance`, `revertTransactionFromBalance` and
  `applyTransactionUpdateToBalance`, with a local `MovementType` so shared code
  never imports a feature.
- Every consumer was updated; the online create/update/delete operations and the
  new local path now import the **same** implementation, as ADR §6 requires.
- `shared/utils/client-id.ts` already exported `readClientDocumentId`; its
  `createClientId` (Firestore-style, ~20 characters, never containing `/`) is now
  the id source of the local repositories when the caller does not provide one.

### 2. Pending balance delta (`shared/lib/local-db/`)

- `pending-balance.ts` exports `readOutboxWalletDeltas(mutations)`: a pure
  per-wallet delta derived from the outbox, never accumulated.
- `pending-balance.snapshots.ts` reads the snapshots: `readTransactionEffect`
  (signed amount against `walletId`) and `readTransferEffect` (`-amount` on
  `fromWalletId`, `+amount` on `toWalletId`), plus the `isSnapshotRecord` guard.
- The create/update/delete matrix is explicit: a `create` applies the
  `localSnapshot` effect, an `update` applies the local effect and reverts the
  `serverSnapshot` effect, and a `delete` reverts `serverSnapshot ?? localSnapshot`.
- Every queued row counts (`pending`, `syncing`, `failed`, `conflict`), because
  the local row already holds the user's change in all four states. Malformed
  snapshots and wallet/category rows are ignored instead of throwing; the `-1`
  orphan id is returned but never matches a wallet. Every partial sum passes
  through `roundMoney`.

### 3. Outbox reads used by the local writes

- `IOutboxRepository.find(ownerId, entityType, entityId, tx?)` returns the queued
  mutation of one entity, so a local write can decide whether it is coalescing a
  create, an update or a delete inside its own transaction.
- `IOutboxRepository.listByOwner(ownerId, tx?)` gained the optional `tx`, so the
  delta can be read inside the same transaction as the write.

### 4. Wallet and category cache with derived balance

- `features/wallets/repositories/local-wallet.balances.ts`:
  `readPendingWalletDeltas`, `applyPendingWalletDeltas`,
  `readWalletsWithPendingBalance(port, ownerId, walletIds?, tx?)` and the runtime
  variant `readLocalWalletsWithPendingBalance`. Displayed balance is
  `roundMoney(serverBalance + delta)`; the stored wallet rows are never mutated.
- `readCachedWallets` returns the derived list (and local-only rows without
  `cacheMeta`), so an offline write is visible on the next read.
- `CachedWalletRepository` mirrors the **server** balance on a remote read and
  returns the derived wallet; when the remote read fails it falls back to the
  cached derived list.
- `CachedCategoryRepository.getCategory` resolves a category by id or `legacyId`
  from the cache, so a local movement write can validate its category offline.

### 5. Offline transaction repository (`features/transactions/repositories/`)

`offline-transaction.repository.ts` implements `ITransactionRepository` over the
split modules `offline-transaction.create.ts`, `.update.ts`, `.delete.ts`,
`.snapshots.ts`, `.validation.ts` and `.write.types.ts`:

- create/update/delete write the movement row and the outbox row in **one** local
  transaction, with a client id and revision 0 on create.
- The local revision is the revision already known to the server; an offline edit
  does not increment it, because the push will bump it on the server.
- `baseRevision` and `serverSnapshot` are preserved when a second edit coalesces
  the queued row.
- create + delete before a push cancels the row and sends nothing.
- Movements linked to a shared expense, group expense, settlement or group
  settlement are rejected with `TRANSACTION_INVALID`; deleting is a soft delete
  (`deletedAt`), idempotent.
- Editing an orphaned movement (`walletId: "-1"`) matches the online path: no
  wallet is written.
- A duplicate id is rejected against the real primary key of the table.

### 6. Offline transfer repository (`features/transfers/repositories/`)

`offline-transfer.repository.ts` over `offline-transfer.create.ts`, `.update.ts`,
`.delete.ts`, `.balances.ts`, `.validation.ts`, `.rows.ts` and
`.write.types.ts`:

- Validation runs **inside** the same local transaction against the derived
  balance (server balance + pending delta), reusing the online helpers, so
  insufficient funds and currency mismatches return the same codes.
- An edit adds back the previous effect before applying the new one.
- `getTransfer` reads the local row first and falls back to the remote.
- create + delete cancels the queued row.

### 7. Factories

- `transaction.factory.ts`: with the flag on it builds
  `OfflineTransactionRepository(CachedTransactionRepository(Firebase…))` plus
  `CachedCategoryRepository`; with the flag off the Firestore repository is
  unchanged.
- `transfer.factory.ts`: `OfflineTransferRepository(CachedTransferRepository(…))`
  plus `CachedWalletRepository`, only with the flag on.

### 8. Single-flight mutations

`shared/hooks/use-single-flight-mutation.ts` serializes movement and transfer
submissions: an in-flight ref rejects a second tap before `mutating` re-renders
the disabled button, so two local transactions cannot race.

### 9. No schema, rules, index or document change

No migration, `firestore.rules`, index or stored document shape changed, so there
is **nothing to deploy** for this slice.

## Delta matrix

| Entity | create | update | delete |
|---|---|---|---|
| transaction | `+signed(local)` on `walletId` | `+signed(local)` then `−signed(server)` | `−signed(server ?? local)` |
| transfer | `−amount` on `fromWalletId`, `+amount` on `toWalletId` | apply local, revert server | revert `server ?? local` |

Signs come from `getSignedTransactionAmount` (income `+`, expense `−`) and the
transfer helper, both from `shared/utils/`; every partial sum is `roundMoney`d.

## Decisions

| Decision | Reason |
|---|---|
| With the flag on, writes are **local-first always** | The user's rule for this slice: one write path behind the flag, and the push arrives in phase 5. With the flag off the online path is untouched. |
| Wallet rows keep the server balance; the shown balance is derived | Deviation from ADR §6 (it said the local write updates the wallet row). Keeping `serverBalance` intact and recomputing `serverBalance + delta` from the outbox means a lost ack or a repeated push can never drift the number, and the display recovers on its own after a pull. |
| Local revision = the revision already known to the server | The server bumps the revision when the mutation is applied; incrementing locally would make the queued `baseRevision` wrong and turn the first push into a false conflict. |
| `dependsOn` stays empty | There is no offline wallet creation yet, so there is no local entity a movement could depend on. It is set when offline wallet writes arrive. |
| Fallback to the remote when there is no port or no local row | The flag can be on in a build without the native module or with a cold cache; reads must not break. |
| Fall back to the cached wallets when the remote read fails | Same phase-3 rule as the other collections: an offline screen keeps the last known data instead of an error. |

## Review findings and fixes

The work went through two read-only `reviewer` passes.

**Revision 1 — changes requested.** (1) Editing an orphaned movement
(`walletId: "-1"`) did not have online parity; it now takes the orphan branch and
returns the same result as the online operation. (2) Two local transactions could
be started by a double tap; `use-single-flight-mutation.ts` serializes movement
and transfer submissions and rejects the second tap.

**Revision 2 — approve with nits.** (1) The new hooks crossed the 150-line limit
and were split. (2) The duplicate-id check ran against a guessed key; it now uses
the real primary key of the table. (3) The orphan comparison did not trim the
stored id; it now compares the trimmed value. (4) Delete still performed an extra
read; it is now idempotent without that read. All fixed and re-verified.

## Verification (26/11/2026)

- `npx tsc --noEmit`, `npx expo lint` and `npm run check:copy`: clean (346 TSX).
- `npx jest`: **440 suites / 2952 tests**.
- `npm run test:coverage`: global **98.92 % statements, 95.07 % branches, 98.69 %
  functions, 99.46 % lines**.
- No `firestore.rules`, index or local schema change, so nothing to deploy.

## Deviations from the ADR

1. **ADR §6 said the local write updates the wallet row.** Here the wallet row
   keeps `serverBalance` and the displayed balance is derived from the outbox on
   every read. Recomputing instead of accumulating is what prevents drift, and it
   is the same formula ADR §6 describes for the display.
2. **No `dependsOn` resolution yet.** Nothing can create a wallet offline in this
   slice, so there is no dependency to record; it stays empty in every row.
3. **The `offline-sync` skill was not created.** The anti-sprawl rule and the
   user's instruction keep this work inside `firebase-data` plus the existing
   skills.

## Known limitations

- **With `EXPO_PUBLIC_OFFLINE_FIRST=true`, writes are queued and never sent.**
  There is no push until phase 5. The local `.env` currently has the flag on, so
  for normal use it must be set to `EXPO_PUBLIC_OFFLINE_FIRST=false` until the
  sync engine lands; otherwise new movements and transfers only exist on that
  device and never reach Firestore.
- A user write can overlap with a cache-mirror transaction on the same port and
  fail with `LOCAL_DB_NESTED_TRANSACTION` or `SAVE_FAILED`. The failure aborts the
  write, so no money is corrupted, and the user can retry; phase 5 serializes the
  two paths.
- `getTransfer` prefers the local row, so a remote edit made elsewhere can look
  stale until the next pull.
- Remote errors are hidden while there is cached data (phase-3 behaviour); marking
  the data as stale is phase 7.
- No device validation yet. `local-db.runtime.ts` and the native transaction path
  cannot run in Jest, so only the in-memory adapter is covered.

## Pending manual steps

- Native rebuild only if the installed client predates `expo-sqlite`.
- With the flag on, validate on a device: airplane mode; create, edit and delete
  an expense, an income and a transfer; kill and relaunch; the derived balance on
  the wallets screen and the dashboard; the offline banner; dark mode.
- Repeat the walkthrough after phase 5 to verify the real synchronization.
- Keep `EXPO_PUBLIC_OFFLINE_FIRST=false` for normal use until then.
