# Offline UX, account purge and web decision (TICKET-023, slice 7)

> Date: 27/11/2026
> Status: Delivered — ADR §12 phase 7. TICKET-023 is `✅ Done (27/11/2026)`.
> Related: `roadmap.md` Phase 7/8, `tickets/[DONE] TICKET-023-FUTURE-OFFLINE-FIRST-SYNC.md`,
> `tickets/TICKET-076-FUTURE-WEB-OFFLINE-SUPPORT.md`, the accepted ADR
> [`2026-11-14-offline-first-architecture.md`](2026-11-14-offline-first-architecture.md),
> the previous slices and `testing/test-guide.md` §11.

## Context

Slices 1-6 delivered the local database, the write protocol, the read cache,
the write queue, the sync engine with conflicts and the offline social
movements. Phase 7 closed with the three remaining pieces:

- local data must disappear when the account signs out or switches;
- the user must be warned before losing queued work and must be able to purge
  the device explicitly;
- web must make an explicit offline decision.

Scope agreed with the user: automatic purge on sign-out with a pending-changes
warning, an explicit **Borrar datos locales** action in Settings, and web kept
online-only with a follow-up ticket (TICKET-076) for parity. No row badges were
added because no epic criterion requires them.

## Delivered

### 1. Account purge (`shared/lib/local-db/`)

- `owner-purge.ts`: `OWNER_SCOPED_LOCAL_TABLES` lists the 18 tables that store
  `ownerId` (thirteen record tables plus `outbox`, `outboxSeq`, `conflicts`,
  `syncState` and `cacheMeta`) and `purgeOwnerLocalData(port, ownerId)` deletes
  them in **one transaction**, always filtered by `ownerId`, so another
  account's rows are never touched.
- `owner-purge.test.ts` seeds two owners across the tables, purges one and
  checks zero rows for it and an intact second account. A contract test parses
  `SCHEMA_TABLE_STATEMENTS` and asserts that the set of tables declaring
  `ownerId` is exactly `OWNER_SCOPED_LOCAL_TABLES`, so a future migration
  cannot silently leave account data behind.

### 2. Revocation guard (`owner-revocation.ts`)

- In-memory set: `revokeOwnerLocalWrites`, `allowOwnerLocalWrites`,
  `isOwnerLocalWritesRevoked`.
- `cache-mirror.ts` (`mirrorOwnerRows` and `mirrorSingleRow`) writes nothing for
  a revoked owner, so a remote read that started before the purge cannot
  repopulate the cache afterwards. `social-cache.ts` delegates to the same
  helpers and inherits the guard.
- `AuthProvider` lifts the block as soon as a user is present again, and
  `AuthService` restores it if `signOut` fails (see §4).
- `mirrorSingleRow` now selects the existing row by `{ id, ownerId }` because
  the social tables use a composite primary key; another account's protected
  row with the same id can no longer suppress the mirror.

### 3. Sync engine (`shared/services/sync/`)

- `single-flight.ts` extracts the in-flight map: `run` reuses the active cycle
  and `whenIdle(ownerId)` awaits it (swallowing its rejection, which the cycle
  already records). No timeout: the purge must not delete rows while a cycle is
  writing.
- `SyncEngine.whenIdle` exposes that wait, and `run` returns an empty
  `offline` result for a revoked owner without reading the port, the executor
  or the pull, closing the window between the wait and the purge commit.

### 4. Sign-out flow (`features/auth`)

- `IAuthRepository.getCurrentUserId()` (Firebase: `auth.currentUser?.uid`).
- `AuthService` takes an optional `AuthLocalSession` port
  (`revoke`/`restore`/`purge`) and runs `reset hint → read uid → revoke →
  signOut → purge`. A failed `signOut` calls `restore`, does not purge and
  propagates the error, so a still-valid session is never left unable to mirror
  or queue writes.
- `auth.factory.ts` wires `revoke`/`restore` statically and loads the purge
  dynamically, keeping Firestore out of the sign-in flow.

### 5. Purge orchestration and UX

- `features/sync/services/account-local-data.ts`:
  - `purgeAccountLocalData(ownerId)` revokes, waits for the engine and purges in
    one transaction; returns `false` when there is no local database. Used by
    the sign-out wrapper, which leaves the revocation active.
  - `purgeLocalAccountOnLogout(ownerId)` is best effort: it logs
    `[local-db] OWNER_PURGE_FAILED` and never blocks the sign-out.
  - `purgeSignedInAccountLocalData(ownerId)` is the manual action: it purges
    and re-allows the account in a `finally`, because the session stays open.
- `SyncContextValue` exposes `refresh()`, so the Settings block can re-read the
  overview after a purge.
- Settings logout (`use-settings-logout.ts` + `settings-logout-section.tsx`):
  a fresh `readSyncOverview(uid)` is read **before** deciding (the context
  counters can lag the 1.5 s write debounce), and the warning lists pending
  changes and conflicts. The dialog is destructive (**Cerrar sesión y
  descartar**) and the button is disabled while checking or signing out.
- Sync block (`use-local-data-purge.ts` + `sync-local-data-action.tsx`):
  danger action **Borrar datos locales** with the same fresh read, a warning
  that names the saved data and pending changes, a busy state, an error banner
  and `localData.unavailable` when the local database is not open.
- Both dialogs render the shared `ConfirmDialog` inside a transparent React
  Native `Modal`: its overlay is `absoluteFill` and would otherwise be clipped
  to the card or section box.

### 6. Web decision

- `isOfflineFirstEnabled()` returns `false` when `Platform.OS === "web"`, even
  with `EXPO_PUBLIC_OFFLINE_FIRST=true`. Web runs online-only: `expo-sqlite`
  needs extra wasm/Metro configuration and `withExclusiveTransactionAsync` is
  unavailable.
- The flag reads `Platform.OS` through a guarded lazy `require("react-native")`
  because a static import breaks the Node-based `shared/lib/local-db` suites;
  the failure is no longer memoized, so a transient load error cannot disable
  the web guard for the rest of the process.
- TICKET-076 records the future web parity work (storage choice, adapter,
  encryption stance and manual checklist) and stays post-V1.

## Decisions

- **Isolation over convenience:** every purge filters by `ownerId`; there is no
  global delete and no endpoint that accepts an empty owner.
- **Revoke before signing out, purge only after:** a failed sign-out restores
  the account instead of leaving a valid session unable to write.
- **Revocation survives sign-out, not the account:** logging back in lifts it;
  the manual purge lifts it in a `finally` because the session stays open.
- **No timeout for `whenIdle`:** correctness first. Firestore reads/writes fail
  fast offline or finish quickly online, and the purge has a visible spinner.
- **Manual purge is honest about its limits:** if the local database is not
  open, the action reports it instead of silently doing nothing.
- **Web is online-only in V1:** the mobile offline path is the product, and the
  ADR already listed web as a later phase.

## Review findings and fixes

The read-only `reviewer` returned **`approve with nits`**, with no blockers or
majors. Applied:

- `mirrorSingleRow` owner-scoped select (cross-account id collision).
- The flag no longer memoizes a `react-native` load failure.
- `SyncEngine.run` refuses a revoked owner.
- Fresh overview read before both warnings (a just-created offline movement
  could otherwise be purged without notice).
- `purgeSignedInAccountLocalData === false` surfaces an error.
- Social-table case in the revocation test, mock restoration in the flag test
  and the schema contract test.

Accepted debt: the two new hooks have no dedicated tests (the project has no
React renderer and hooks are outside the coverage gate), the `Modal` +
`ConfirmDialog` composition is duplicated in Settings and sync, and device /
dark-mode validation is still manual.

## Verification (27/11/2026)

- `npx tsc --noEmit`, `npx expo lint` and `npm run check:copy`: clean
  (**359 TSX**).
- `npx jest`: **475 suites / 3235 tests**.
- `npm run test:coverage`: global **96.56 % statements, 90.26 % branches,
  97.54 % functions, 97.56 % lines**; `owner-purge.ts`,
  `owner-revocation.ts`, `cache-mirror.ts`, `offline-first.flag.ts`,
  `single-flight.ts`, `account-local-data.ts`, `auth.service.ts`,
  `auth.factory.ts` and `firebase-auth.repository.ts` at 100 %.
- No `firestore.rules`, index, mapper or money-arithmetic change, so nothing to
  deploy for this slice.

## Known limitations

- The engine reports an empty `offline` result for a revoked owner; the runtime
  ignores it while the sign-out is in progress.
- A manual purge while online re-downloads the account on a later sync by
  design; the promise is "free the device now", not "stay empty".
- A remote read that is still in flight when the user signs in again (same
  account) can mirror again after the purge, which is correct: the account is
  active.
- Website parity, local encryption and background sync remain out of V1 scope.

## Pending manual steps

- Deploy the rules collected across the offline slices **before** enabling
  `EXPO_PUBLIC_OFFLINE_FIRST`.
- Run `testing/test-guide.md` §11 on a device, including the new logout purge,
  **Borrar datos locales** and web steps, in light and dark mode.
