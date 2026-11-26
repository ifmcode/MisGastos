import type { LocalDatabaseTransaction } from "./database.port";
import type { LocalRow, OutboxEntityType } from "./local-db.types";
import {
  pickRecordColumns,
  RECORD_TABLE,
  resolveSyncedEntityType,
} from "./local-record.columns";

/** Marks a pushed record as in sync and stores the revision the server wrote. */
export async function markRecordSynced(
  tx: LocalDatabaseTransaction,
  entityType: OutboxEntityType,
  ownerId: string,
  entityId: string,
  revision: number,
  now: string,
): Promise<void> {
  await tx.update(
    RECORD_TABLE[resolveSyncedEntityType(entityType)],
    { id: entityId, ownerId },
    { revision, syncStatus: "synced", updatedAt: now },
  );
}

/** Local status while the mutation is queued or blocked. */
export async function setRecordSyncStatus(
  tx: LocalDatabaseTransaction,
  entityType: OutboxEntityType,
  ownerId: string,
  entityId: string,
  syncStatus: "pending" | "failed" | "conflict",
  now: string,
): Promise<void> {
  await tx.update(
    RECORD_TABLE[resolveSyncedEntityType(entityType)],
    { id: entityId, ownerId },
    { syncStatus, updatedAt: now },
  );
}

/** "Keep remote": the remote document replaces the local row. */
export async function applyRemoteRecord(
  tx: LocalDatabaseTransaction,
  entityType: OutboxEntityType,
  ownerId: string,
  entityId: string,
  snapshot: Record<string, unknown>,
  now: string,
): Promise<void> {
  const type = resolveSyncedEntityType(entityType);
  const table = RECORD_TABLE[type];
  const rows = await tx.select<LocalRow>(table, {
    where: { id: entityId, ownerId },
    limit: 1,
  });
  const existing = rows[0] ?? {};
  const incoming = pickRecordColumns(snapshot, type);
  const updatedAt =
    typeof incoming.updatedAt === "string" && incoming.updatedAt.length > 0
      ? incoming.updatedAt
      : typeof existing.updatedAt === "string" && existing.updatedAt.length > 0
        ? existing.updatedAt
        : now;

  // The port contract requires the WHOLE row: a partial upsert would drop the
  // columns the remote snapshot does not carry.
  await tx.upsert(table, {
    ...existing,
    ...incoming,
    id: entityId,
    ownerId,
    updatedAt,
    syncStatus: "synced",
  });
}

/** Remote document gone: the local row has nothing left to represent. */
export async function deleteLocalRecord(
  tx: LocalDatabaseTransaction,
  entityType: OutboxEntityType,
  ownerId: string,
  entityId: string,
): Promise<void> {
  await tx.delete(RECORD_TABLE[resolveSyncedEntityType(entityType)], {
    id: entityId,
    ownerId,
  });
}
