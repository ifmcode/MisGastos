import type { LocalRow } from "@/shared/lib/local-db/local-db.types";
import { LocalCacheMetaRepository } from "@/shared/lib/local-db/cache-meta.repository";
import {
  mirrorOwnerRows,
  mirrorSingleRow,
} from "@/shared/lib/local-db/cache-mirror";
import { getLocalDatabase } from "@/shared/lib/local-db/local-db.runtime";
import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

import { Transfer } from "../types/transfer.types";
import { sortTransfersByDate } from "../utils/transfer-sort";
import {
  fromTransferLocalRow,
  toTransferLocalRow,
} from "./local-transfer.mapper";

const COLLECTION = "transfers" as const;

/** Cached transfers, or null when the flag is off, no port or no fetch. */
export async function readCachedTransfers(
  ownerId: string,
): Promise<Transfer[] | null> {
  if (!isOfflineFirstEnabled()) return null;

  try {
    const port = await getLocalDatabase();
    if (!port) return null;

    const meta = new LocalCacheMetaRepository(port);
    if ((await meta.getFetchedAt(ownerId, COLLECTION)) === null) return null;

    const rows = await port.select<LocalRow>(COLLECTION, {
      where: { ownerId },
    });
    const transfers = rows.flatMap((row) => {
      const transfer = fromTransferLocalRow(row);
      // Same rule as `FirebaseTransferRepository`: soft-deleted transfers keep
      // their local row but never reach the list.
      return transfer && !transfer.deletedAt ? [transfer] : [];
    });

    return sortTransfersByDate(transfers);
  } catch {
    return null;
  }
}

/** Mirrors the remote list and stamps the fetch in one local transaction. */
export async function cacheTransfers(
  ownerId: string,
  transfers: readonly Transfer[],
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
      rows: transfers.map(toTransferLocalRow),
      now,
    });
    await meta.markFetched(ownerId, COLLECTION, now, tx);
  });
}

/**
 * Mirrors one created/updated/deleted transfer. The delete result carries
 * `deletedAt`, so the cached read filter hides it without a physical delete;
 * this write never marks the collection as fetched.
 */
export async function cacheTransfer(
  ownerId: string,
  transfer: Transfer,
  now: string,
): Promise<void> {
  if (!isOfflineFirstEnabled()) return;

  const port = await getLocalDatabase();
  if (!port) return;

  await port.transaction((tx) =>
    mirrorSingleRow(tx, {
      table: COLLECTION,
      ownerId,
      row: toTransferLocalRow(transfer),
      now,
    }),
  );
}
