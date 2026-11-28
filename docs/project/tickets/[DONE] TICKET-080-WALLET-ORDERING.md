# [DONE] TICKET-080 - Wallet Ordering and Home Slider Order

**Type:** Improvement
**Priority:** Medium
**Status:** ✅ Done (28/11/2026)
**Related:** TICKET-001, TICKET-018, TICKET-030
**Sprint:** V1 / Phase 8 (next after TICKET-075, before TICKET-052)

## Description
Let the owner choose the order of the active wallets in the **Carteras** screen and keep that order everywhere the wallet collection is listed, especially in the **Inicio** wallet slider. The order is one persisted `sortOrder` per wallet document, read by a single shared comparator, so the wallets screen, the home slider, the wallet pickers and the filters cannot drift apart.

Reordering uses the same explicit up/down controls as category ordering (TICKET-030): no drag-and-drop and no new dependency. Archived wallets are not part of the reorder.

## Requirements
### Persistence and ordering
- [x] Add an optional `sortOrder` number to the `Wallet` model, the Firestore mapper and the stored document; ignore non-finite or negative values
- [x] Add a single `compareWallets` comparator (explicit `sortOrder` ascending, then the legacy `createdAt` descending / `name` fallback) and use it in the Firebase repository and in every local cache read
- [x] Keep legacy wallets without `sortOrder` in their current newest-first order until the owner reorders, with no mandatory data migration
- [x] Add the nullable `sortOrder` column to the local SQLite schema through an append-only migration, and map it in both cache directions
- [x] Persist a move atomically with a `writeBatch` that updates only `sortOrder`, `updatedAt` and `revision`, skipping unchanged wallets and unknown ids
- [x] Append a newly created wallet at the end once an explicit order exists; before the first reorder keep today's newest-first behaviour
- [x] Leave archived wallets outside the reorder moves and keep their relative order

### Wallets screen
- [x] Add a **Reordenar** toggle to the wallets list header that switches to reorder mode and a **Listo** action that leaves it
- [x] Show labelled up/down controls per active wallet, disabled at the edges and while saving
- [x] Apply each move optimistically, restore the previous order and show a translated error when the save fails
- [x] Block concurrent moves, keep the floating add button hidden in reorder mode and stop opening the wallet actions while reordering
- [x] Add Spanish and English copy plus accessibility labels via the `wallets` namespace; no hardcoded strings

### Consistency and quality
- [x] The home wallet slider, wallet pickers, filters and totals read the same ordered collection with no second sorting rule
- [x] Add tests for the comparator, the order helpers, the service reorder, the batch write and the local mapping
- [x] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [x] Reordering wallets survives leaving and reopening the screen, and an app restart
- [x] The **Inicio** wallet slider shows the same order chosen in the **Carteras** screen
- [x] Wallet pickers, filters and totals show the same order and no duplicate or lost wallet appears
- [x] Archived wallets are not moved, duplicated or lost by a reorder
- [x] A failed save restores the previous order, keeps the list usable and shows a translated error
- [x] A new wallet appends at the end once an explicit order exists; legacy lists keep their newest-first order until the first reorder
- [x] An offline read of cached wallets shows the persisted order
- [x] The reorder batch passes the wallet rules (owner and revision bump) and a non-owner write is rejected
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Implemented

### Model and comparator
- `Wallet.sortOrder?: number` in `features/wallets/types/wallet.types.ts`. `mapWalletDocument` (`features/wallets/repositories/wallet.mapper.ts`) reads a finite non-negative value, floors it and omits the key when absent, so legacy wallets keep `createdAt` descending until the first reorder.
- `compareWallets` (`features/wallets/utils/wallet-order.ts`) is the single comparator: explicit `sortOrder` ascending first, then the legacy `createdAt` descending / `name` fallback. It is used by `firebase-wallet.repository.ts`, `local-wallet.cache.ts` (`readCachedWallets`) and `local-wallet.balances.ts` (`readWalletsWithPendingBalance`), so the Inicio slider, the wallet pickers, the filters and the totals share one order with no screen change.
- `moveWallet`, `renumberWallets` and `applyWalletOrder` build each new order. Only active neighbours swap, archived wallets keep their relative position, and ids missing from the requested order stay at the end, so a wallet is never lost.
- A new wallet has no `sortOrder` yet, so it appends after the ordered list; before the first reorder the list keeps today's newest-first order.

### Persistence
- `reorderWalletDocuments` (`features/wallets/repositories/wallet-order.operation.ts`) reads the owner's wallets once (guarded by `assertServerSnapshot`) and commits one `writeBatch` writing only `sortOrder`, `updatedAt` and `revision: nextRevision(stored)`. Unknown ids are skipped and the batch commits nothing when there is nothing to write.
- `persistWalletOrder` (`features/wallets/services/wallet-reorder.ts`) applies `applyWalletOrder` and returns without a write when the canonical order already matches, so a no-op never bumps a revision. `WalletService.reorderWallets` exposes it.
- The wallet rules already required the owner and a revision bump on update: no rule, index or deploy work was needed. The reorder write stays online-only with rollback, like TICKET-030.

### Local cache
- Migration 004 (`shared/lib/local-db/migrations/migration-004.ts`) adds the nullable `wallets.sortOrder` column; `toWalletLocalRow`/`fromWalletLocalRow` (`local-wallet.mapper.ts`) map it in both directions.
- After the remote batch, `CachedWalletRepository.updateWalletOrders` (`features/wallets/repositories/cached-wallet.repository.ts`) updates the cached `sortOrder` best-effort, so an offline read after a restart shows the persisted order.
- Accepted trade-off: the cached `revision`/`updatedAt` stay one online read behind. It only matters if a queued offline wallet write derives its next revision before that read.

### Wallets screen
- `WalletReorderToggle` (**Reordenar** / **Listo**) in `wallets-list-header.tsx` and `WalletReorderActions` (labelled up/down arrows, disabled at the edges and while saving) with the reorder hint and a translated error. `useWalletReorder` applies each move optimistically, blocks concurrent moves, restores the previous order on failure and keeps the toggle usable.
- In reorder mode the floating add button is hidden and row taps no longer open the wallet actions. The toggle requires more than one active wallet to enter, but stays visible while `reordering` so the owner can always leave.
- Spanish and English copy and accessibility labels live in `features/wallets/locales/{es,en}.json`.

### Scope
- No money or balance change, no drag-and-drop, no new dependency and no archived-wallet reorder.

### Tests and verification
- `features/wallets/utils/__tests__/wallet-order.test.ts` (comparator, renumber, apply and move), `services/__tests__/wallet.service.reorder.test.ts`, `repositories/__tests__/firebase-wallet.repository.order.test.ts` (batched write with the revision bump), `local-wallet.cache.orders.test.ts` and `local-wallet.mapper.test.ts` (round-trip and offline order), and `repositories/__tests__/cached-wallet.repository.orders.test.ts` (cache update and its failure direction).
- `npx tsc --noEmit`, `npx expo lint`, `npx jest --runInBand` (**484 suites / 3285 tests**) and `npm run check:copy` (**362 TSX**) pass. Coverage: **96.49 % statements, 90.23 % branches, 97.45 % functions, 97.53 % lines**.
- Reviewer verdict: `approve with nits`. The two substantive defects were fixed before closing (the SQLite `sortOrder` write after the Firestore batch, and the stale "schema version 3" comment); one UI nit was also fixed (the toggle stays visible while reordering). The remaining nits were accepted, not implemented.
- Manual device validation (light/dark, es/en, screen reader, airplane-mode restart) is pending.

## Technical Notes
- **Precedent:** TICKET-030 solved the same problem for categories (`features/categories/utils/category-order.ts`, `reorderCategoryDocuments`, `CategoryService.reorderCategories`). Reuse that shape: pure helpers, optimistic UI, rollback on failure.
- **Why the home slider needs no screen change:** the dashboard already derives its slider from `useWallets` -> `getActiveWallets`, so ordering in the repository/cache is enough.
- **Legacy fallback:** current wallets sort by `createdAt` descending. `compareWallets` keeps that as the fallback and only puts explicit `sortOrder` wallets first, so existing users see no change until they reorder.
- **Law of the field:** `sortOrder` is optional and belongs to the owner's document. Rules already require the owner and a revision bump on update, so the batch must raise `revision` with `nextRevision`.
- **Archived wallets:** the list renders active wallets; archived ones live in the footer section. Moves swap only active neighbours and renumber the full collection so no position is lost.
- **Out of scope:** drag-and-drop, per-device order, reordering archived wallets and an offline write queue for wallet reordering (a failed offline attempt rolls back and shows the error, like category ordering).
- **Decision record:** `docs/project/development-notes/session-notes/2026-11-28-wallet-ordering.md`.

## Validation Plan
- Create three wallets, reorder them in **Carteras**, leave and reopen the screen, go to **Inicio** and confirm the slider keeps that order.
- Restart the app and confirm the order persists; then read with the offline flag on and no connection to confirm the cached order matches.
- Archive a wallet and confirm the remaining moves still work, the archived wallet keeps its place in its section and nothing is lost.
- Force a failed save (offline) and confirm the previous order returns with the translated error and the controls stay usable.
- Check Spanish and English copy and the accessibility labels of the toggle and the arrows, then run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-001 Wallets (list, repository and cache)
- TICKET-030 Category ordering (reorder pattern and comparator semantics)
- TICKET-023 Offline-first local cache (SQLite migration and cache mapping)
- TICKET-075 Remove pull-to-refresh from every list (the previous V1 closeout item)
- TICKET-052 Push notifications (the next V1 closeout item after this one)
