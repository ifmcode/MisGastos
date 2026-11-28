# Wallet ordering (TICKET-080)

> Date: 28/11/2026
> Status: Delivered — TICKET-080 is `✅ Done (28/11/2026)`.
> Related: `roadmap.md` Phase 8, `tickets/[DONE] TICKET-080-WALLET-ORDERING.md`,
> TICKET-030 (category ordering), TICKET-023 (offline cache) and
> `project-memory.md`.

## Context

The **Carteras** screen listed wallets newest first, and the **Inicio** wallet
slider, the wallet pickers, the filters and the totals all derived their order
from that same collection. The owner had no way to choose the position of a
wallet, so a frequently used wallet could sit at the bottom of every list.

The scope is ordering only: no money, balance, transfer, shared-expense or
offline-queue change, no drag-and-drop and no new dependency. Archived wallets
stay outside the reorder because they live in their own footer section.

## Decision

One optional `sortOrder` per wallet document, read by a single comparator that
every wallet list already goes through.

`compareWallets` (`features/wallets/utils/wallet-order.ts`) sorts wallets with
an explicit `sortOrder` ascending first, then falls back to the previous rule
(`createdAt` descending, `name` as tiebreaker). A wallet without a position
always sorts after an explicit one, which gives two properties for free:

- **Legacy lists do not change.** Existing accounts have no `sortOrder`, so they
  keep today's newest-first order until the owner reorders once; no data
  migration is needed.
- **New wallets append.** A wallet created after the first reorder has no
  position, so it lands at the end of the ordered list instead of inserting
  itself by date. Before the first reorder the same rule reproduces the
  newest-first order.

`moveWallet`, `renumberWallets` and `applyWalletOrder` are pure and build the
full next collection plus the documents that really changed. `moveWallet` swaps
only the visible neighbours, so archived wallets keep their relative position;
`applyWalletOrder` keeps ids missing from the requested sequence at the end, so
a wallet cannot be lost or duplicated.

## Persistence

- `persistWalletOrder` (`features/wallets/services/wallet-reorder.ts`) reads the
  owner's wallets, applies `applyWalletOrder` and returns without writing when
  the canonical order already matches, so a no-op never bumps a revision.
  `WalletService.reorderWallets` exposes it.
- `reorderWalletDocuments`
  (`features/wallets/repositories/wallet-order.operation.ts`) reads the owner's
  wallets once (guarded by `assertServerSnapshot`, so an empty cached Firestore
  snapshot cannot be mistaken for server truth) and commits one `writeBatch`.
  Each entry writes only `sortOrder`, `updatedAt` and
  `revision: nextRevision(stored)`; an id that no longer exists is skipped
  because guessing its base revision would reject the whole batch.
- No rule change was needed: `wallets` already requires the owner and a revision
  bump on update. There is no new index and nothing to deploy.
- The reorder write stays online-only with rollback, the same shape as
  TICKET-030; it is not queued in the offline outbox.

## Local cache

- Migration 004 (`shared/lib/local-db/migrations/migration-004.ts`) adds a
  nullable `wallets.sortOrder`; `toWalletLocalRow`/`fromWalletLocalRow` map it in
  both cache directions.
- `readCachedWallets` and `readWalletsWithPendingBalance` sort with
  `compareWallets` after mapping, so the offline list matches the online one and
  the pending-balance derivation keeps working.
- **Offline order after a restart:** the Firestore batch alone was not enough,
  because a relaunch reads SQLite before the first successful online read, so
  the cached rows would still carry the old positions.
  `CachedWalletRepository.updateWalletOrders` therefore updates the cached
  `sortOrder` after the remote batch, best-effort: a failed cache update is
  swallowed because the server write is already the source of truth, and the
  next online read repairs the cache anyway.
- **Accepted trade-off:** the cached `revision` and `updatedAt` stay one online
  read behind the reorder. That only matters if a queued offline wallet write
  derives its next revision from the cache before that read; the online path
  reads the stored document, so it is unaffected.

## Guarantees for archived wallets

Archived wallets are not part of the reorder list, so a move can never target
them. They keep their stored `sortOrder` (or their legacy fallback position)
while the active wallets are renumbered around them, which preserves their
relative order inside the archived section and avoids duplicates or losses.

## UI

- `WalletReorderToggle` (**Reordenar** / **Listo**) sits in the wallets list
  header; `WalletReorderActions` renders the labelled up/down controls per active
  wallet, disabled at the edges and while saving.
- `useWalletReorder` applies each move optimistically, blocks concurrent moves
  with a ref guard, restores the previous collection and shows a translated
  error when the save fails.
- While reordering, the floating **+** is hidden and a row tap no longer opens
  the wallet actions, so a stray tap cannot start an edit mid-reorder.
- The toggle requires more than one active wallet to enter, but stays visible
  while `reordering` so the owner can always leave even if the active list drops
  below two (for example after an archive).
- Copy and accessibility labels live in `features/wallets/locales/{es,en}.json`;
  `npm run check:copy` covers the new strings.

## Tests

- `features/wallets/utils/__tests__/wallet-order.test.ts`: comparator semantics
  (explicit vs legacy), renumber, apply with unknown/duplicate ids and move with
  a visible subset.
- `services/__tests__/wallet.service.reorder.test.ts`: the no-op, the legacy
  normalisation on the first move and the delegated update.
- `repositories/__tests__/firebase-wallet.repository.order.test.ts`: one batch,
  only the three fields, the revision bump, skipped unknown ids and no commit
  when nothing changes.
- `repositories/__tests__/local-wallet.cache.orders.test.ts`,
  `local-wallet.mapper.test.ts` and `cached-wallet.repository.orders.test.ts`:
  mapper round-trip, cached order, offline order after a reorder and both
  failure directions of the post-batch cache update.

## Review findings

The pre-close `reviewer` returned **`approve with nits`**. The two substantive
defects were fixed before closing:

- the reorder did not write `sortOrder` to SQLite, so an offline read after a
  restart showed the old order (fixed with the post-batch cache update);
- a stale comment still described the local schema as "version 3" (now 4).

One UI nit was also fixed: the reorder toggle stays visible while `reordering`
even if the active list drops below two wallets. The remaining nits were
accepted, not implemented.

## Verification (28/11/2026)

- `npx tsc --noEmit` and `npx expo lint`: clean.
- `npx jest --runInBand`: **484 suites / 3285 tests**.
- Coverage: **96.49 % statements, 90.23 % branches, 97.45 % functions,
  97.53 % lines**.
- `npm run check:copy`: passed (**362 TSX**).
- No rules, index or deploy work: the wallet contract already covered the batch.

## Pending manual steps

- Manual device validation is pending: light and dark theme, Spanish and
  English, screen reader labels of the toggle and the arrows, a reorder followed
  by an app restart, and an airplane-mode restart to confirm the cached order.

## Next ticket

TICKET-052 — push notifications for background and closed app.
