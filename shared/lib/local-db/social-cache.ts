import type { LocalCacheCollection, LocalRow, LocalWhere } from "./local-db.types";
import { LocalCacheMetaRepository } from "./cache-meta.repository";
import { mirrorOwnerRows, mirrorSingleRow } from "./cache-mirror";
import { getLocalDatabase } from "./local-db.runtime";
import { isOfflineFirstEnabled } from "./offline-first.flag";

export type SocialCacheReadInput = {
  table: LocalCacheCollection;
  ownerId: string;
  /** `cacheMeta` key; per-parent collections append their id. */
  collection: string;
  scope?: LocalWhere;
};

/**
 * Cached rows of a social collection, or null when offline-first is off, there
 * is no local port, the read fails, or the collection was never fetched and has
 * no local rows (a local write must stay visible before the first online read).
 */
export async function readCachedSocialRows({
  table,
  ownerId,
  collection,
  scope,
}: SocialCacheReadInput): Promise<LocalRow[] | null> {
  if (!isOfflineFirstEnabled()) return null;

  try {
    const port = await getLocalDatabase();
    if (!port) return null;

    const meta = new LocalCacheMetaRepository(port);
    const fetchedAt = await meta.getFetchedAt(ownerId, collection);
    const rows = await port.select<LocalRow>(table, {
      where: scope ? { ownerId, ...scope } : { ownerId },
    });

    if (fetchedAt === null && rows.length === 0) return null;

    return rows;
  } catch {
    return null;
  }
}

export type SocialCacheWriteInput = SocialCacheReadInput & {
  rows: readonly LocalRow[];
  now: string;
};

/** Mirrors a remote list and stamps the fetch in one local transaction. */
export async function cacheSocialRows({
  table,
  ownerId,
  collection,
  scope,
  rows,
  now,
}: SocialCacheWriteInput): Promise<void> {
  if (!isOfflineFirstEnabled()) return;

  const port = await getLocalDatabase();
  if (!port) return;

  const meta = new LocalCacheMetaRepository(port);

  await port.transaction(async (tx) => {
    await mirrorOwnerRows(tx, { table, ownerId, scope, rows, now });
    await meta.markFetched(ownerId, collection, now, tx);
  });
}

/** Mirrors one record without stamping the collection as fetched. */
export async function cacheSocialRow(
  table: LocalCacheCollection,
  ownerId: string,
  row: LocalRow,
  now: string,
): Promise<void> {
  if (!isOfflineFirstEnabled()) return;

  const port = await getLocalDatabase();
  if (!port) return;

  await port.transaction((tx) =>
    mirrorSingleRow(tx, { table, ownerId, row, now }),
  );
}

/** Drops one cached record (a deleted friendship or request). Best effort. */
export async function removeCachedSocialRow(
  table: LocalCacheCollection,
  ownerId: string,
  id: string,
): Promise<void> {
  if (!isOfflineFirstEnabled()) return;

  const port = await getLocalDatabase();
  if (!port) return;

  await port.transaction((tx) => tx.delete(table, { id, ownerId }));
}
