import type { LocalDatabaseTransaction } from "./database.port";
import type {
  LocalCacheCollection,
  LocalRow,
  LocalWhere,
} from "./local-db.types";
import { readLocalRowId } from "./local-row.readers";
import { isOwnerLocalWritesRevoked } from "./owner-revocation";

export type CacheMirrorInput = {
  /** Collection being mirrored (personal or social). */
  table: LocalCacheCollection;
  ownerId: string;
  /** Extra equality filters for a per-parent collection (e.g. groupId). */
  scope?: LocalWhere;
  /** Entities from the remote list read, already converted to local rows. */
  rows: readonly LocalRow[];
  /** Single time source for rows that arrive without an `updatedAt`. */
  now: string;
};

export type CacheSingleRowInput = {
  table: LocalCacheCollection;
  ownerId: string;
  row: LocalRow;
  now: string;
};

/**
 * Statuses owned by local writes. A pull must never overwrite or delete them,
 * otherwise a queued change (phase 4) would disappear before it syncs.
 */
const PROTECTED_SYNC_STATUSES: ReadonlySet<string> = new Set([
  "pending",
  "syncing",
  "failed",
  "conflict",
]);

function isProtected(row: LocalRow): boolean {
  return (
    typeof row.syncStatus === "string" &&
    PROTECTED_SYNC_STATUSES.has(row.syncStatus)
  );
}

function isSynced(row: LocalRow): boolean {
  return row.syncStatus === "synced";
}

function buildSyncedRow(row: LocalRow, ownerId: string, now: string): LocalRow {
  const updatedAt =
    typeof row.updatedAt === "string" && row.updatedAt.trim().length > 0
      ? row.updatedAt
      : now;

  return { ...row, ownerId, updatedAt, syncStatus: "synced" };
}

/**
 * Replaces the owner's synced rows of one collection with the remote list.
 *
 * - every incoming row is upserted as `synced` unless a local row with the same
 *   id is protected by a pending mutation;
 * - rows that disappeared from the remote list are deleted only when they are
 *   still `synced`, so pending/syncing/failed/conflict rows survive a pull.
 *
 * A revoked owner (signed out, purge in progress) writes nothing: its remote
 * read may still be in flight and must not repopulate the deleted cache.
 */
export async function mirrorOwnerRows(
  tx: LocalDatabaseTransaction,
  { table, ownerId, scope, rows, now }: CacheMirrorInput,
): Promise<void> {
  if (isOwnerLocalWritesRevoked(ownerId)) return;

  const where: LocalWhere = scope ? { ownerId, ...scope } : { ownerId };
  const existing = await tx.select<LocalRow>(table, { where });
  const existingById = new Map<string, LocalRow>();

  for (const row of existing) {
    const id = readLocalRowId(row);
    if (id) existingById.set(id, row);
  }

  const incomingIds = new Set<string>();

  for (const row of rows) {
    const id = readLocalRowId(row);
    if (!id) continue;

    incomingIds.add(id);

    const current = existingById.get(id);
    if (current && isProtected(current)) continue;

    await tx.upsert(table, buildSyncedRow(row, ownerId, now));
  }

  for (const [id, row] of existingById) {
    if (incomingIds.has(id)) continue;
    if (!isSynced(row)) continue;

    await tx.delete(table, { id, ownerId });
  }
}

/**
 * Mirrors one mutated record after an online create/update/delete.
 *
 * It upserts the row as `synced` unless a local row with the same id is
 * protected by a pending mutation. It never deletes other rows and never
 * stamps `cacheMeta`: one record does not mean the collection was fetched.
 * The lookup is scoped to the owner: social tables use `(ownerId, id)` as the
 * primary key, so another account may legitimately hold the same id.
 * A revoked owner writes nothing, for the same reason as `mirrorOwnerRows`.
 */
export async function mirrorSingleRow(
  tx: LocalDatabaseTransaction,
  { table, ownerId, row, now }: CacheSingleRowInput,
): Promise<void> {
  if (isOwnerLocalWritesRevoked(ownerId)) return;

  const id = readLocalRowId(row);
  if (!id) return;

  const existing = await tx.select<LocalRow>(table, {
    where: { id, ownerId },
    limit: 1,
  });
  if (existing[0] && isProtected(existing[0])) return;

  await tx.upsert(table, buildSyncedRow(row, ownerId, now));
}
