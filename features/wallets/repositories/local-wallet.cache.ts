import type { LocalRow } from "@/shared/lib/local-db/local-db.types";
import { LocalCacheMetaRepository } from "@/shared/lib/local-db/cache-meta.repository";
import { mirrorOwnerRows } from "@/shared/lib/local-db/cache-mirror";
import { getLocalDatabase } from "@/shared/lib/local-db/local-db.runtime";
import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

import { Wallet } from "../types/wallet.types";
import { compareWallets, type WalletOrderUpdate } from "../utils/wallet-order";
import {
  applyPendingWalletDeltas,
  readPendingWalletDeltas,
} from "./local-wallet.balances";
import { fromWalletLocalRow, toWalletLocalRow } from "./local-wallet.mapper";

const COLLECTION = "wallets" as const;

/**
 * Cached wallets with `serverBalance + pending outbox delta`, or null when the
 * flag is off, there is no port, the read fails, or the collection was never
 * fetched AND has no local rows (a local write must be visible even before the
 * first online list read).
 */
export async function readCachedWallets(
  ownerId: string,
): Promise<Wallet[] | null> {
  if (!isOfflineFirstEnabled()) return null;

  try {
    const port = await getLocalDatabase();
    if (!port) return null;

    const meta = new LocalCacheMetaRepository(port);
    const fetchedAt = await meta.getFetchedAt(ownerId, COLLECTION);
    const rows = await port.select<LocalRow>(COLLECTION, {
      where: { ownerId },
    });

    if (fetchedAt === null && rows.length === 0) return null;

    const wallets = rows.flatMap((row) => {
      const wallet = fromWalletLocalRow(row);
      return wallet ? [wallet] : [];
    });
    const deltas = await readPendingWalletDeltas(port, ownerId);

    return applyPendingWalletDeltas(wallets.sort(compareWallets), deltas);
  } catch {
    return null;
  }
}

/** Mirrors the remote list and stamps the fetch in one local transaction. */
export async function cacheWallets(
  ownerId: string,
  wallets: readonly Wallet[],
  now: string,
): Promise<void> {
  if (!isOfflineFirstEnabled()) return;

  const port = await getLocalDatabase();
  if (!port) return;

  const meta = new LocalCacheMetaRepository(port);

  await port.transaction(async (tx) => {
    await mirrorOwnerRows(tx, {
      table: COLLECTION,
      ownerId,
      rows: wallets.map(toWalletLocalRow),
      now,
    });
    await meta.markFetched(ownerId, COLLECTION, now, tx);
  });
}

/**
 * Applies a persisted reorder to the cached rows so the new order survives an
 * app restart without a connection. Only `sortOrder` changes: balances,
 * `updatedAt` and `revision` stay as the last server read left them, and the
 * fetch stamp is not touched because this is not a fresh list read. The
 * `ownerId` filter keeps another account's rows out of reach.
 */
export async function updateCachedWalletOrders(
  ownerId: string,
  updates: readonly WalletOrderUpdate[],
): Promise<void> {
  if (!isOfflineFirstEnabled() || updates.length === 0) return;

  const port = await getLocalDatabase();
  if (!port) return;

  await port.transaction(async (tx) => {
    for (const update of updates) {
      await tx.update(
        COLLECTION,
        { ownerId, id: update.id },
        { sortOrder: update.sortOrder },
      );
    }
  });
}
