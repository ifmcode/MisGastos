# TICKET-076 - Web Offline Support

**Type:** Feature / Platform  
**Priority:** Low  
**Status:** ⏳ Pending  
**Related:** TICKET-023, PM-023  
**Sprint:** Post-V1

## Description
V1 keeps offline-first on iOS and Android only. The web build runs online: `expo-sqlite` on web needs extra wasm/Metro configuration and `withExclusiveTransactionAsync` is not available there, so the V1 decision recorded for TICKET-023 Phase 7 is to turn the offline flag off when `Platform.OS === "web"` (that phase closed on 27/11/2026 with the decision applied). This ticket exists so that web parity is not forgotten: it evaluates a web storage adapter behind `DatabasePort`, decides it explicitly and only enables the flag on web once the behaviour matches mobile.

## Requirements
### Storage decision
- [ ] Evaluate IndexedDB and OPFS against `expo-sqlite` on web, behind the existing `DatabasePort` contract, and record the decision (chosen option, rejected alternatives and why)
- [ ] Build the adapter or accessory behind `DatabasePort` with the same transaction semantics the mobile adapter exposes (`transaction`, nested-transaction rejection, row-oriented `upsert`/`update`/`delete`/`select`/`count`, DDL and schema version)
- [ ] Decide and document the storage and its encryption: OPFS and IndexedDB are origin-scoped but not encrypted, while the [offline-first ADR](../development-notes/session-notes/2026-11-14-offline-first-architecture.md) §9 accepts OS-level protection only for mobile

### Flag and parity
- [ ] Enable the offline flag on web only when the parity below is verified; until then the web build keeps the online path
- [ ] Cover the adapter, the outbox queue and the sync engine with tests, plus a manual checklist for the browser
- [ ] Make no change to the mobile local schema and no change to the Firestore rules
- [ ] Show no regression of the online mode: with the flag off, the web build behaves exactly as before

## Acceptance Criteria
- [ ] On web, creating, editing and deleting a record offline survives a page reload
- [ ] Reconnecting syncs every queued mutation exactly once
- [ ] Conflicts are surfaced and resolvable with the same options as on mobile
- [ ] Signing out purges that account's local rows locally
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` are clean

## Technical Notes
- **Why web is out of V1:** decision 12 of TICKET-023 and the [offline-first ADR](../development-notes/session-notes/2026-11-14-offline-first-architecture.md) §9 / §12 leave web offline to a later phase; §12 phase 7 closes the V1 epic with a web decision, not with web parity. Web is not a V1 launch requirement.
- **Anchors:**
  - `shared/lib/local-db/database.port.ts` — `DatabasePort` / `LocalDatabaseTransaction`, row-oriented contract every adapter must satisfy.
  - `shared/lib/local-db/local-db.runtime.ts` — the single opener (`getLocalDatabase`, `setLocalDatabasePort` test seam) where a web adapter replaces the dynamic `expo-sqlite` import.
  - `shared/lib/local-db/offline-first.flag.ts` — `isOfflineFirstEnabled()`, the only reader of `EXPO_PUBLIC_OFFLINE_FIRST`; the web gate belongs there or in the opener, never in screens.
  - References for the contract to match: `shared/lib/local-db/expo-sqlite.database.ts`, `sqlite-port.ts` and the test adapter `in-memory.database.ts`.
- **Constraint:** `withExclusiveTransactionAsync` does not exist on web; a web adapter must serialize access itself, as `shared/lib/local-db/serialized.database.ts` already does around the port.
- **Security:** the ADR accepts OS-level protection for mobile only. Web storage is browser-origin-scoped and unencrypted, so the ticket must state the accepted risk (or add encryption) before the flag is enabled.
- **No schema fork:** the SQL schema and migrations stay shared; a web adapter changes the storage engine, not the tables.
- Out of scope: background sync, push notifications and any business-rule change.

## Validation Plan
- Set `EXPO_PUBLIC_OFFLINE_FIRST=true`, restart the bundler and open the web build; confirm the app loads its data while online.
- With the flag on, go offline (devtools offline mode), create, edit and delete a movement and a transfer, then reload the page; the rows and their pending badges must survive.
- Go back online and confirm the queue drains, the Firebase console shows one `appliedMutations` marker per mutation and the balances match mobile.
- Force a conflict (edit on mobile while the web edit is pending) and resolve it with each option.
- Sign out with pending changes, confirm the warning, and verify the account's rows are gone from web storage; sign in again and confirm the confirmed data is pulled.
- Run the same scenario in a second browser profile and with private/incognito storage to confirm the adapter fails gracefully.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-023 offline-first implementation (the flag, the `DatabasePort` contract and the sync engine this ticket extends to web)
