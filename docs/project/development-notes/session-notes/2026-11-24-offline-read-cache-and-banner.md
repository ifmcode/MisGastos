# Offline read cache and offline banner (TICKET-023, slice 3)

> Date: 24/11/2026
> Status: Delivered — ADR §12 phase 3. TICKET-023 stays `🚧 In progress`.
> Related: `roadmap.md` Phase 7, `tickets/TICKET-023-FUTURE-OFFLINE-FIRST-SYNC.md`,
> the accepted ADR [`2026-11-14-offline-first-architecture.md`](2026-11-14-offline-first-architecture.md),
> the previous slices
> [`2026-11-24-offline-local-db-foundations.md`](2026-11-24-offline-local-db-foundations.md) and
> [`2026-11-24-offline-revision-and-soft-delete.md`](2026-11-24-offline-revision-and-soft-delete.md),
> `testing/test-guide.md`

## Context

Slices 1 and 2 delivered the local database and the write protocol. This slice is
ADR §12 phase 3: a local read cache for the four personal collections (wallets,
categories, movements and transfers) plus the offline banner, both behind a flag
that is off by default. The user is not able to write offline yet; the cache only
serves what the last online read stored.

No epic requirement or acceptance criterion is closed by it. The write queue,
the sync engine, conflicts, offline social and the offline UX (pending counts,
last sync time, manual retry, purge) are still pending.

## Delivered

### 1. Schema v2 (`shared/lib/local-db/`)

- `migrations/migration-002.ts` adds the four link ids on `transactions`
  (`sharedExpenseId`, `groupExpenseId`, `settlementId`, `groupSettlementId`),
  `fromWalletName`/`toWalletName` on `transfers`, the
  `cacheMeta(ownerId, collection, fetchedAt)` table and rebuilds `categories` so
  `sortOrder` is nullable.
- The rebuild is required, not cosmetic: `Category.sortOrder` is genuinely
  optional (legacy documents fall back to `createdAt`/`name` in
  `compareCategories`) but v1 declared the column `NOT NULL`. `InMemoryDatabase`
  does not enforce `NOT NULL`, so the failure would only appear on a real device,
  where a legacy category would be rejected by the cache insert. SQLite cannot
  drop the constraint with `ALTER`, hence the create-copy-drop-rename. Storing `0`
  was rejected because it moves legacy categories to the front and changes the
  online order.
- `migrations/migration-001.statements.ts` freezes the v1 DDL (migrations are
  append-only); `schema.tables.ts` holds the current v2 shape and
  `schema.keys.ts` / `schema.ts` follow.

### 2. Cache infrastructure (`shared/lib/local-db/`)

- `cache-mirror.ts`: `mirrorOwnerRows` upserts the remote list as `synced`,
  never overwrites a row whose `syncStatus` is `pending`/`syncing`/`failed`/
  `conflict`, and deletes only vanished `synced` rows of that owner.
  `mirrorSingleRow` applies the same protection to one record, never deletes and
  never stamps `cacheMeta`.
- `cache-meta.repository.ts`: `getFetchedAt` / `markFetched`, so a collection that
  was fetched and is empty reads as `[]` instead of as a cold cache.
- `local-row.readers.ts`: typed row helpers shared by the feature mappers.
- `local-db.runtime.ts`: `getLocalDatabase()` memoizes one open + migrated port,
  returns `null` when the flag is off or the open/migration fails (logs only
  `LOCAL_DB_OPEN_FAILED`, retries later) and is the only module that references
  `expo-sqlite`, through a dynamic `import()` so Jest never loads the native
  module. `setLocalDatabasePort` / `resetLocalDatabasePort` are the test seam.
- `offline-first.flag.ts`: `isOfflineFirstEnabled()` reads
  `process.env.EXPO_PUBLIC_OFFLINE_FIRST === "true"`, default off, no Settings UI.
  Expo inlines the variable at build time.

### 3. Per-feature cache (`wallets`, `categories`, `transactions`, `transfers`)

Three files per feature, each in `features/<feature>/repositories/`:

- `local-<entity>.mapper.ts`: row ⇄ domain. It delegates to the existing Firestore
  mappers so validation is not duplicated. `Wallet.balance` is stored in the
  existing `serverBalance` column until phase 4 adds the pending delta, and
  `includeInTotal` is stored as 1/0.
- `local-<entity>.cache.ts`: `readCached<Entities>` returns `null` when the flag is
  off, there is no port, the collection was never fetched or the read fails;
  `cache<Entities>` mirrors and stamps `cacheMeta` in one transaction.
- `cached-<entity>.repository.ts`: read-through decorator over the Firebase
  repository. Every method delegates; only the list read mirrors. Best effort.

### 4. Read path

- `shared/hooks/use-async-collection.ts` gained an optional `readCached`. The
  initial load paints the cached list first and then replaces it with the remote
  result; a remote failure with cached data keeps the list and does not set the
  error; a cold cache keeps today's loading/error behaviour; pull-to-refresh stays
  remote-only; a cache read rejection never breaks the load.
- The four data hooks pass their `readCached*`, and the four service factories
  pick the cached repository only when the flag is on.

### 5. Cache coherence after writes (still online in this slice)

- `CachedTransactionRepository` and `CachedTransferRepository` mirror the returned
  record after create/update/delete, best effort.
- Both delete operations return the record with `deletedAt`, and the cached reads
  apply the same filter as the remote ones (`deletedAt === null` for movements,
  `!deletedAt` for transfers), so a deleted record never reappears offline.
- Wallet and category mutations are **not** wired: their lists refresh on the next
  online list read. Phase 4 owns the local write path.

### 6. Offline banner (`features/sync/`)

- `shared/utils/network-status.ts`: `resolveNetworkStatus`, a three-state NetInfo
  collapse where `unknown` counts as online so the strip never flashes.
- `shared/hooks/use-network-status.ts`: NetInfo subscription shared by the strip
  and the collection hooks; `enabled: false` skips the subscription entirely.
- `utils/banner-offset.ts`: `TAB_BAR_HEIGHT = 49` (mirrors
  `@react-navigation/bottom-tabs` `BottomTabBar`), `TAB_ROUTES` with the five tabs,
  `getBannerBottomOffset` and `isTabRoute`.
- `components/offline-banner.tsx` (edge-to-edge strip, one accessible element with
  the full sentence, `pointerEvents="none"`, `warning*` theme tokens),
  `components/offline-banner-view.tsx`, `components/offline-banner-host.tsx`
  (returns `null` before mounting the subscription when the flag is off) and
  `styles/offline-banner.styles.ts`.
- The `sync` namespace in `features/sync/locales/{es,en}.json` is registered in
  `shared/i18n/resources.ts`. Copy: ES `Sin conexión · Mostrando datos guardados`,
  EN `No connection · Showing saved data`.
- Rendered in `app/_layout.tsx` as a sibling of the navigator, after
  `<RootNavigator />`.
- Why a bottom strip: every screen applies its own `insets.top`, so a top strip
  would need ~30 screens changed or would duplicate the safe-area gap. The strip's
  bottom edge sits on the tab bar on the five tab routes (`insets.bottom + 49`) and
  on the bottom safe area on pushed routes; FABs live inside the screen container,
  which ends at the tab bar top, so they do not collide.

### 7. Dependency

`@react-native-community/netinfo@12.0.1` was added with `npm install` (the bundled
Expo version). `npx expo install` fails in this environment with the corporate
certificate, the same limitation already recorded for `expo-sqlite`.

## Decisions

| Decision | Reason |
|---|---|
| Cache-first read with a remote refresh | ADR §3 says reads come from SQLite; painting the cached list first and replacing it with the remote result keeps the online path fresh at the same time. |
| Row mappers delegate to the existing Firestore mappers | One validation path, so the cache cannot accept a record the online repository would reject. |
| `serverBalance` reused instead of a new `balance` column | The pending delta does not exist yet; the column already holds the signed server value phase 4 will add to. |
| `cacheMeta` distinguishes cold from fetched-empty | Without it an empty collection would look like a cold cache forever and the list would wait for the network. |
| Protected rows are never overwritten by a pull | Phase 4 queued writes must survive a refresh; only `synced` rows are replaced or deleted. |
| Post-mutation mirroring only for movements and transfers | They are the collections where a stale row is a money bug (a deleted movement or transfer reappearing offline); wallet and category lists are display-only and refresh on the next list read. |
| The flag lives in an env var instead of Settings | No half-built feature is exposed to users, and the build can bake the value in. |
| Dynamic `import()` of `expo-sqlite` | Jest stays native-free and the bundle does not load the module while the flag is off. |
| Global bottom strip instead of one per screen | Avoids touching every screen's safe area and can never leave a gap above the content or duplicate `insets.top`. |

## Review findings and fixes

The read-only `reviewer` returned **changes requested**. All findings were fixed
and re-verified before closing:

- **Blocker:** `categories.sortOrder` was written as `NULL` into a `NOT NULL`
  column, which `InMemoryDatabase` accepted and a device would reject. Fixed with
  the v2 table rebuild described above.
- **Major:** soft-deleted records were served by the cache. The cached reads now
  apply the same `deletedAt` filter as the remote reads.
- **Major:** the cache was not updated after a mutation. Movements and transfers
  now mirror the returned record after create/update/delete.
- Minors fixed: the fetched-but-empty case and owner isolation are now tested, the
  banner is a single accessible element, and NetInfo is no longer subscribed when
  the flag is off (`offline-banner-host` returns `null` first).
- Accepted nits: `TAB_BAR_HEIGHT`/`TAB_ROUTES` are brittle if a tab is added or on
  the compact tab bar (32 px on tablet/landscape, so the strip would sit 17 px
  high); a cached list surviving a remote failure does not mark the data as stale
  (phase 7).

## Verification (24/11/2026)

- `npx tsc --noEmit`, `npx expo lint` and `npm run check:copy`: clean (346 TSX).
- `npx jest`: **426 suites / 2832 tests**.
- `npm run test:coverage`: global **98.90 % statements, 95.00 % branches, 98.64 %
  functions, 99.48 % lines**; `shared/lib/local-db` **97.57 / 97.34 / 97.66 /
  97.76** and `features/sync/utils` **100 %**.
- `local-db.runtime.ts` stays partial (**78.94 / 58.33 / 75 / 81.81**) because the
  dynamic `expo-sqlite` path cannot run in Jest.
- No `firestore.rules` or index change, so nothing to deploy.

## Device validation and fixes (25/11/2026)

The first run on a physical Android device (dark mode) found two defects that
Jest could not see. Both are fixed and the suite is green again.

### 1. The strip was unreadable in dark mode

`warningSurface` is a translucent amber in dark mode, so the strip took the colour
of whatever was behind it and the pale `warningText` lost contrast. It now uses a
solid `warning` background with a computed foreground (`background` in dark mode,
`onPrimary` in light mode), which keeps the 12 px label readable over any content.
The top border was removed because the background is solid.

### 2. An offline read wiped the cache

Verified on the device: without connection, Firestore `getDocs` **resolves** with
an empty snapshot served from its local cache (`size = 0`,
`metadata.fromCache = true`) instead of rejecting. The read path treated it as
server truth, so `mirrorOwnerRows` deleted every cached row and the screens
painted their empty states. The cache marker was stamped at the same time, so the
device looked "cached but empty" and could not recover while offline.

`shared/lib/local-db/offline-read.ts` adds `assertServerSnapshot`, called by the
four list reads (`wallets`, `categories`, `transactions`, `transfers`): a cached
**empty** snapshot throws `OfflineReadError` (`OFFLINE_READ`), so
`useAsyncCollection` keeps the cached list, nothing is mirrored and the cache is
not deleted. A cached snapshot with documents is the last known server state and
is still accepted. The guard is deliberately not behind the feature flag: serving
an empty list for an unreachable server is wrong in both modes.

Consequence: with a cold cache and no connection the screen shows the regular load
error instead of a misleading empty list.

### 3. The lists refresh when the connection returns

The strip already disappeared on reconnect (NetInfo drives it), but the screens
kept painting the cached list until the user switched tabs or pulled to refresh.
`useAsyncCollection` gained an optional `refreshOnReconnect`: the shared
`useNetworkStatus` hook reports the offline→online transition and the hook runs
its `refresh` once, so the remote read replaces the cached data and the mirror
updates. It is wired by the four data hooks and only subscribes while
`EXPO_PUBLIC_OFFLINE_FIRST` is enabled. `network-status.ts` and
`use-network-status.ts` moved from `features/sync` to `shared/utils` and
`shared/hooks` because the shared collection hook now depends on them (shared
code must not import a feature). The ADR plans the sync engine's pull on
reconnect for phase 5; this is the phase-3 equivalent until then.

### 4. Dev-only LogBox toasts over the app

While offline, the Firestore SDK emits a connection warning on every launch and
React Native's LogBox renders it — and its error counterpart — as white toasts at
the bottom of the screen. They are a development overlay, not product UI, they
disappear in release builds, and in dark mode their text is unreadable. The root
layout now calls `LogBox.ignoreLogs` under `__DEV__` for the four Firestore
connection patterns (`Could not reach Cloud Firestore backend`,
`WebChannelConnection`, `RestConnection`, `transport errored`), so the stack of
white bars cannot cover the app any more. The underlying connectivity problem is
the sync engine's job in phase 5.

## Deviations from the ADR

1. **ADR §4 did not list** the four transaction link ids, the transfer wallet
   display names, `cacheMeta` or the nullable `sortOrder`. All are needed to
   rebuild a domain record from a row and to tell a cold cache from an empty one.
2. **ADR §12 placed the `OfflineBanner` in the tabs shell**; this slice renders it
   as a global overlay in `app/_layout.tsx`.
3. **ADR §11.4 listed `netinfo` as a prerequisite**; it arrives with this slice,
   its first consumer.
4. **ADR §3/§5 planned a pull engine plus `onSnapshot` listeners**; this phase
   refreshes the cache on each list read. The pull engine is phase 5.
5. **The ADR-planned `offline-sync` skill was not created.** The anti-sprawl rule
   and the user's instruction keep this work inside `firebase-data` plus the
   existing skills.

## Known limitations

- No offline writes yet. Wallet and category mutations are not mirrored, so their
  lists only catch up on the next online read; movements and transfers are
  mirrored after a mutation.
- A cached list that survives a remote failure is not marked as stale (phase 7).
- `TAB_BAR_HEIGHT`/`TAB_ROUTES` duplicate the tab bar layout and do not follow the
  compact tab bar, so the strip can sit too high on tablet or landscape.
- `local-db.runtime.ts` keeps partial coverage because the native path cannot run
  in Jest.
- The flag is env-only and off by default; there is no user-facing switch.

## Pending manual steps

- Native rebuild before enabling the flag: this is the first runtime use of
  `expo-sqlite` and of `netinfo`.
- Set `EXPO_PUBLIC_OFFLINE_FIRST=true` and restart the bundler: the value is
  inlined at build time.
- Device validation of airplane mode after one online load (wallets, categories,
  movements and transfers), of app kill/relaunch while offline, of reconnect, of
  the strip on tab routes vs pushed routes and of dark mode.
- After the cache-wipe fix (25/11/2026) the cache must be repopulated with one
  online load: the phone had no internet during the validation session
  (`ERR_INTERNET_DISCONNECTED`), so the airplane-mode walkthrough still needs to
  be repeated end to end.

## Android toolchain findings (24/11/2026, macOS)

The Android development build was generated and compiled on the macOS machine
(`expo prebuild` + `app:assembleDebug`, 31 min the first time). `android/` is
gitignored, so nothing of this reached the repository. Three findings that are
**local to this machine** and worth recording:

1. `~/.zshrc` reassigned `PATH` further down the file, so the Android exports had
   to live at the end of the file; `cmdline-tools/latest/bin` was missing from
   `PATH` and is now included. `JAVA_HOME` points at JDK 17.
2. A stale package install produced
   `TurboModuleRegistry.getEnforcing('RNGoogleSignin') could not be found` even
   though the APK contained the module (same md5 as the installed
   `base.apk`). A clean `adb uninstall` + `adb install -r app-debug.apk` fixed it,
   so the slice needs no code or dependency change. Keep it in mind for future
   native rebuilds.
3. Google sign-in cannot complete on the emulator: the `AndroidWifi` network
   reports `PARTIAL_CONNECTIVITY` and the flow ends at *There was a problem
   connecting to accounts.google.com*. This is a host network/VPN limitation, not
   the app. Email sign-in or a physical device with working connectivity is
   required to validate the cache and the banner manually.

