import type { LocalRow } from "@/shared/lib/local-db/local-db.types";
import { LocalCacheMetaRepository } from "@/shared/lib/local-db/cache-meta.repository";
import {
  mirrorOwnerRows,
  mirrorSingleRow,
} from "@/shared/lib/local-db/cache-mirror";
import { getLocalDatabase } from "@/shared/lib/local-db/local-db.runtime";
import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

import { Transaction } from "../types/transaction.types";
import {
  fromTransactionLocalRow,
  toTransactionLocalRow,
} from "./local-transaction.mapper";

const COLLECTION = "transactions" as const;

/** Cached movements, or null when the flag is off, no port or no fetch. */
export async function readCachedTransactions(
  ownerId: string,
): Promise<Transaction[] | null> {
  if (!isOfflineFirstEnabled()) return null;

  try {
    const port = await getLocalDatabase();
    if (!port) return null;

    const meta = new LocalCacheMetaRepository(port);
    if ((await meta.getFetchedAt(ownerId, COLLECTION)) === null) return null;

    const rows = await port.select<LocalRow>(COLLECTION, {
      where: { ownerId },
    });

    return rows.flatMap((row) => {
      const transaction = fromTransactionLocalRow(row);
      // Same rule as `FirebaseTransactionRepository`: soft-deleted movements
      // keep their local row but never reach the list.
      return transaction && transaction.deletedAt === null ? [transaction] : [];
    });
  } catch {
    return null;
  }
}

/** Mirrors the remote list and stamps the fetch in one local transaction. */
export async function cacheTransactions(
  ownerId: string,
  transactions: readonly Transaction[],
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
      rows: transactions.map(toTransactionLocalRow),
      now,
    });
    await meta.markFetched(ownerId, COLLECTION, now, tx);
  });
}

/**
 * Mirrors one created/updated/deleted movement. The delete result carries
 * `deletedAt`, so the cached read filter hides it without a physical delete;
 * this write never marks the collection as fetched.
 */
export async function cacheTransaction(
  ownerId: string,
  transaction: Transaction,
  now: string,
): Promise<void> {
  if (!isOfflineFirstEnabled()) return;

  const port = await getLocalDatabase();
  if (!port) return;

  await port.transaction((tx) =>
    mirrorSingleRow(tx, {
      table: COLLECTION,
      ownerId,
      row: toTransactionLocalRow(transaction),
      now,
    }),
  );
}
