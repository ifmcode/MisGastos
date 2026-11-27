import type { DatabasePort, LocalDatabaseTransaction } from "./database.port";
import type {
  LocalRecordSyncStatus,
  LocalRow,
  LocalTableName,
  OutboxEntityType,
} from "./local-db.types";
import { LocalOutboxRepository } from "./local-outbox.repository";
import { INITIAL_REVISION } from "@/shared/utils/revision";
import { requestSyncTrigger } from "@/shared/services/sync/sync-trigger";

export type SocialWriteEntity = { id: string; revision: number };

type SocialWriteBase<T extends SocialWriteEntity> = {
  port: DatabasePort;
  ownerId: string;
  entity: T;
  entityType: OutboxEntityType;
  table: LocalTableName;
  toRow: (
    entity: T,
    ownerId: string,
    syncStatus?: LocalRecordSyncStatus,
  ) => LocalRow;
  fromRow: (row: LocalRow) => T | null;
  snapshot: (entity: T) => Record<string, unknown>;
  /** Notification write replayed after the server operation, if any. */
  extraSnapshot?: Record<string, unknown>;
  createId: () => string;
  now: string;
};

export type SocialCreateInput<T extends SocialWriteEntity> =
  SocialWriteBase<T>;

export type SocialEntityInput<T extends SocialWriteEntity> =
  SocialWriteBase<T> & { entityId: string };

/**
 * Writes one local social record and its outbox row in a single transaction.
 * The record keeps the revision the server already knows: the push bumps it.
 */
export async function writeSocialCreate<T extends SocialWriteEntity>(
  input: SocialCreateInput<T>,
): Promise<T> {
  await input.port.transaction(async (tx) => {
    await tx.upsert(input.table, input.toRow(input.entity, input.ownerId, "pending"));

    await new LocalOutboxRepository(input.port).enqueue(
      {
        clientMutationId: input.createId(),
        ownerId: input.ownerId,
        entityType: input.entityType,
        entityId: input.entity.id,
        operation: "create",
        baseRevision: INITIAL_REVISION,
        localSnapshot: localSnapshot(input),
        serverSnapshot: {},
        now: input.now,
      },
      tx,
    );
  });

  requestSyncTrigger();
  return input.entity;
}

/** Local edit; `serverSnapshot` preserves the last server state for the delta. */
export async function writeSocialUpdate<T extends SocialWriteEntity>(
  input: SocialEntityInput<T>,
): Promise<T> {
  await input.port.transaction(async (tx) => {
    const row = await readRow(input, tx);
    if (!row) throw new Error("SOCIAL_RECORD_NOT_FOUND");

    const stored = input.fromRow(row);
    if (!stored) throw new Error("SOCIAL_RECORD_INVALID");

    const outbox = new LocalOutboxRepository(input.port);
    const mutation = await outbox.find(
      input.ownerId,
      input.entityType,
      input.entityId,
      tx,
    );
    const server = mutation
      ? {
          baseRevision: mutation.baseRevision,
          serverSnapshot: mutation.serverSnapshot,
        }
      : {
          baseRevision: stored.revision,
          serverSnapshot: input.snapshot(stored),
        };

    await tx.upsert(input.table, input.toRow(input.entity, input.ownerId, "pending"));
    await outbox.enqueue(
      {
        clientMutationId: input.createId(),
        ownerId: input.ownerId,
        entityType: input.entityType,
        entityId: input.entityId,
        operation: "update",
        baseRevision: server.baseRevision,
        localSnapshot: localSnapshot(input),
        serverSnapshot: server.serverSnapshot,
        now: input.now,
      },
      tx,
    );
  });

  requestSyncTrigger();
  return input.entity;
}

/**
 * Soft delete. A create that was never attempted is cancelled locally instead
 * of being sent, exactly like the personal movements.
 */
export async function writeSocialDelete<T extends SocialWriteEntity>(
  input: SocialEntityInput<T>,
): Promise<T> {
  await input.port.transaction(async (tx) => {
    const row = await readRow(input, tx);
    if (!row) throw new Error("SOCIAL_RECORD_NOT_FOUND");

    const stored = input.fromRow(row);
    if (!stored) throw new Error("SOCIAL_RECORD_INVALID");

    const outbox = new LocalOutboxRepository(input.port);
    const mutation = await outbox.find(
      input.ownerId,
      input.entityType,
      input.entityId,
      tx,
    );

    if (mutation?.operation === "create" && mutation.attempts === 0) {
      await tx.delete(input.table, { id: input.entityId, ownerId: input.ownerId });
      await outbox.remove(input.ownerId, mutation.clientMutationId, tx);
      return;
    }

    const server = mutation
      ? {
          baseRevision: mutation.baseRevision,
          serverSnapshot: mutation.serverSnapshot,
        }
      : {
          baseRevision: stored.revision,
          serverSnapshot: input.snapshot(stored),
        };

    await tx.upsert(input.table, input.toRow(input.entity, input.ownerId, "pending"));
    await outbox.enqueue(
      {
        clientMutationId: input.createId(),
        ownerId: input.ownerId,
        entityType: input.entityType,
        entityId: input.entityId,
        operation: "delete",
        baseRevision: server.baseRevision,
        localSnapshot: localSnapshot(input),
        serverSnapshot: server.serverSnapshot,
        now: input.now,
      },
      tx,
    );
  });

  requestSyncTrigger();
  return input.entity;
}

function localSnapshot<T extends SocialWriteEntity>(
  input: SocialWriteBase<T>,
): Record<string, unknown> {
  return {
    ...input.snapshot(input.entity),
    ...(input.extraSnapshot ?? {}),
  };
}

async function readRow<T extends SocialWriteEntity>(
  input: SocialEntityInput<T>,
  tx: LocalDatabaseTransaction,
): Promise<LocalRow | null> {
  const rows = await tx.select<LocalRow>(input.table, {
    where: { id: input.entityId, ownerId: input.ownerId },
    limit: 1,
  });

  return rows[0] ?? null;
}
