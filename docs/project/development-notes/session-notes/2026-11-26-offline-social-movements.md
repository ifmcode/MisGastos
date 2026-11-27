# Offline social movements (TICKET-023, slice 6)

> Date: 26/11/2026
> Status: Delivered — ADR §12 phase 6. TICKET-023 stays `🚧 In progress`.
> Related: `roadmap.md` Phase 7, `tickets/[DONE] TICKET-023-FUTURE-OFFLINE-FIRST-SYNC.md`,
> the accepted ADR [`2026-11-14-offline-first-architecture.md`](2026-11-14-offline-first-architecture.md),
> the previous slices
> [`2026-11-26-offline-write-queue.md`](2026-11-26-offline-write-queue.md) and
> [`2026-11-26-offline-sync-engine.md`](2026-11-26-offline-sync-engine.md)

## Context

Slices 1-5 made personal expenses, incomes and transfers local-first, with an
outbox, an exactly-once sync engine, retry/backoff and a conflict UI. Social data
was still Firestore-only: opening a group or a friend offline failed, and a group
expense or a settlement could not be created without a connection.

This slice is ADR §12 phase 6 — **offline group/friend movements** — still behind
`EXPO_PUBLIC_OFFLINE_FIRST`. It closes the local persistence of social data, the
offline creates/edits/deletes of the four social movement types, their sync, and
the local wallet/ledger derivation. It does **not** close the logout/account-switch
purge or the offline UX/observability work, so the epic stays in progress.

Scope agreed with the user: **full movement parity**, and **no offline group
creation** (creating a group, inviting, joining and friend management stay
online-only).

## Delivered

### 1. Schema v3 (`shared/lib/local-db/`)

`migrations/migration-003.ts` adds nine tables, all scoped by `ownerId` and keyed
by `(ownerId, id)` so two accounts can cache the same shared document without
overwriting each other:

- Lookups: `friendships`, `friendRequests`, `publicProfiles`, `groups`,
  `groupInvitations`.
- Movements: `sharedExpenses`, `settlements`, `groupExpenses`, `groupSettlements`,
  each with `revision`, `deletedAt` and `syncStatus`.

`LocalCacheCollection`, `OutboxEntityType` (`shared-expense`, `settlement`,
`group-expense`, `group-settlement`) and `LOCAL_DB_PRIMARY_KEYS` were extended.
`outbox.mapper.ts` and `conflict.mapper.ts` know the new entity types; without
that they silently degraded them to `transaction`.

### 2. Social read cache

- `local-<entity>.mapper.ts` / `local-<entity>.cache.ts` / `cached-<entity>.repository.ts`
  for friends, groups and the four movement types.
- `shared/lib/local-db/social-cache.ts` centralizes the flag/port/cold-cache
  rules, JSON lists and `cacheMeta` keys. `mirrorOwnerRows` gained an optional
  scope, so a group list is mirrored without touching the other groups.
- Reads are **cache-first with a remote refresh**: a remote failure falls back to
  the last cached list; a locally created record is still returned when the
  remote read answers "not found".
- `assertServerSnapshot` was added to the social list reads, so an empty cached
  snapshot served offline can never wipe the social cache (the phase-3 defect).
- Friend requests and group invitations fall back to an empty list offline when
  nothing was cached; they are not money records.

### 3. Social pull

`sync-social-pull.ts` mirrors friendships, requests, profiles, groups, shared
expenses, settlements and every group's expenses/settlements after the personal
pull. `pullGroupMovements` uses `Promise.allSettled` so one unreadable group does
not prevent the others from being cached, while the cycle still reports the
failure. Group invitations and group activity stay online-managed and are cached
on demand.

### 4. Revision and idempotency in the online operations

`SharedExpense`, `Settlement`, `GroupExpense` and `GroupSettlement` now carry
`revision` (create 0, every update/delete stored + 1; legacy documents map to 0).
The four create DTOs omit it and the data builders write it.

The online operations accept `{ id, sync }`, where `sync` is
`{ clientMutationId, baseRevision, ownerId }`:

- `appliedMutations/{ownerId}__{clientMutationId}` is written **inside the same
  transaction** as the record, the linked movement and the wallet.
- A replay returns the stored document without re-applying anything (and without
  re-writing the notification).
- Updates/deletes compare `baseRevision` with the stored `revision` and report
  `DELETED_REMOTELY` when the document is missing or already soft-deleted.
- Creates accept the client id, so the local row and the server document share it.
- The settlement/group-settlement notification is stored in the outbox snapshot
  and replayed by the executor (the dedupe key keeps it idempotent).

Rules: `revision` bumps on the four collections, the field/diff allowlists include
it, `appliedMutations` accepts the four social entity types, and `get` was split
from `list` so a missing document resolves to not-found (the conflict snapshot)
instead of permission-denied.

### 5. Local writes

`shared/lib/local-db/social-write.ts` writes one record and one coalesced outbox
row in a single local transaction, with the same create/update/delete matrix and
the same "keep the server-known revision" rule as the personal path. A create
deleted before it was attempted is cancelled without sending it.

`OfflineSharedExpensesRepository`, `OfflineSettlementsRepository`,
`OfflineGroupExpensesRepository` and `OfflineGroupSettlementsRepository` implement
the existing repository interfaces; reads delegate to the cached implementation
and a record that is not cached is edited through the online path.

### 6. Local balances

`pending-balance.snapshots.ts` derives a wallet effect from a social snapshot:
an expense debits the payer's `walletId`, a settlement credits the receiver's
`receiverWalletId`. `pending-balance.ts` applies the same create/update/delete
matrix as movements and transfers, so the displayed wallet balance already
includes a queued group/shared expense, a settlement or a link change. Group and
friend debts keep being folded by the existing pure functions over the cached
lists, which now include the pending local rows.

### 7. Sync executor and conflicts

New executor modules for the four social types, dispatched from
`firestore-sync-executor.ts`. Updates and deletes always go through the **linked**
operation: it reads the stored link on the server, so a stale local snapshot can
never orphan a wallet movement created on another device. `wallets` stays empty
and the pull right after the push refreshes `serverBalance`.

The conflict view now understands `amountCents`, `description`/`note` and
`receiverWalletId`, so a social conflict shows readable values.

### 8. Factories

Behind `EXPO_PUBLIC_OFFLINE_FIRST`, shared expenses, settlements, group expenses,
group settlements, groups, friends and the friend ledger are wired as
`Offline(Cached(Firebase))`; with the flag off every factory returns the previous
Firebase implementation.

## Decisions

| Decision | Reason |
|---|---|
| No offline group creation | Confirmed with the user: creating a group, inviting, joining and friend management stay online. The movement offline support is the actual phase-6 exit criterion. |
| Social rows are keyed by `(ownerId, id)` | Shared documents have the same id for several accounts; an `id`-only key would let one account's cache overwrite another's. |
| The executor always uses the linked update/delete | The local snapshot can be stale about the link; the server operation reads the stored movement and reverts it exactly once. |
| The link id is never read from an update snapshot | A stale snapshot must not clear a movement created by another device. |
| A stale soft delete is a conflict | Editing a record the other participant already deleted must stop as `DELETED_REMOTELY`, not as a permanent `permission-denied`. |
| Linked personal movements are not mirrored locally | The group/shared record is visible offline and its wallet effect is derived from the outbox; the personal movement appears after the push + pull. |
| Settlement notifications are stored in the outbox snapshot | The builder is not serializable; the resulting `NotificationWrite` is deterministic and can be replayed exactly. |
| Per-group pull with `allSettled` | One broken group must not block the cache of the others. |

## Review findings and fixes

Two read-only reviews were run. The first returned `changes requested` for a
`deletedAt` gap: an edit over a record deleted on another device could pass the
local snapshot and be denied by the rules as a permanent error. Fixed in the four
update paths (plain and linked) with `DELETED_REMOTELY`/`ALREADY_DELETED`.

The second returned `approve with nits`; the two actionable nits were fixed: a
replayed group-settlement update no longer rewrites its notification, and an
already-deleted delete writes the stored revision in its marker instead of the
next one, so the local revision does not drift. The pre-existing rule that blocks
deleting a group expense whose payer was removed from the group is out of scope
and stays as a known limitation.

## Verification (26/11/2026)

- `npx tsc --noEmit`: clean.
- `npx expo lint`: clean.
- `npx jest`: **469 suites / 3195 tests**.
- `npm run test:coverage`: global **96.53 % statements, 90.23 % branches,
  97.52 % functions, 97.55 % lines**.
- `npm run check:copy`: 357 TSX files.
- `npx firebase deploy --only firestore:rules --dry-run`: compiles (nothing
  deployed).

## Deviations

1. **ADR §10 expected append-only shared ledgers.** The implementation keeps
   mutable documents with soft delete, so this slice adds `revision` to the four
   social records instead of relying on compensating entries. The ledger fold is
   unchanged.
2. **No offline group creation**, as agreed with the user (the ADR allowed it).
3. **No `onSnapshot` listeners**; the pull is still per collection, and now per
   group for group movements.
4. **Group activity and invitations are not pulled in bulk**; invitations are
   cached on demand and the activity feed stays online.

## Known limitations

- Group creation, invitations, joining and friend management are online-only.
- The group activity feed is online-only; the expenses, settlements, balances and
  members still render offline from the cache.
- A linked personal movement is not created locally; it appears after the push
  and the following pull. Until then the wallet balance is correct because of the
  outbox delta.
- The executor returns no wallets, so `serverBalance` is refreshed by the pull
  that follows a successful push. A failed pull leaves the last known balance.
- The social pull is N+1 per group (expenses + settlements). Fine for V1, but it
  will need batching if a user has many groups.
- A conflict created by a replay of a create whose document was later deleted is
  not re-creatable with the same marker; this edge is shared with the personal
  creates and is not solved in this slice.
- No device validation yet. The SQLite adapter, the native transaction path and
  the social screens cannot be exercised in Jest.
- The new rules are **pending deployment** and must be deployed with this client:
  an older client that does not write `revision` on update would be denied.

## Pending manual steps

1. Deploy `firestore.rules` before enabling the flag.
2. Set `EXPO_PUBLIC_OFFLINE_FIRST=true` and restart the bundler; rebuild only if
   the installed client predates `expo-sqlite`/`netinfo`.
3. Device walkthrough: online load of friends and groups → airplane mode →
   create/edit/delete a shared expense, a settlement, a group expense and a group
   settlement → confirm the derived balances and the friend/group timelines →
   kill/relaunch → reconnect and confirm each mutation lands exactly once and the
   balances match the online path.
4. Two-device conflicts on a shared/group expense and a settlement, with both
   resolutions.
5. Light/dark mode on the friend/group detail, the forms and the conflict sheet.
