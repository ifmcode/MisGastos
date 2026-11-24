import type { LocalDatabaseTransaction, LocalQueryOptions } from "./database.port";
import { LOCAL_DB_ERROR_CODES, LocalDbError } from "./local-db.errors";
import type {
  LocalRow,
  OutboxEntityType,
  OutboxMutation,
} from "./local-db.types";
import { outboxMutationFromRow } from "./outbox.mapper";

export const OUTBOX_TABLE = "outbox" as const;

export const OUTBOX_SEQ_TABLE = "outboxSeq" as const;

export const OUTBOX_SEQ_ASC: LocalQueryOptions["orderBy"] = [
  { column: "seq", direction: "asc" },
];

/** The single queued mutation of that entity, if any. */
export async function findOutboxMutationForEntity(
  tx: LocalDatabaseTransaction,
  ownerId: string,
  entityType: OutboxEntityType,
  entityId: string,
): Promise<OutboxMutation | null> {
  const rows = await tx.select<LocalRow>(OUTBOX_TABLE, {
    where: { ownerId, entityType, entityId },
    limit: 1,
  });
  const row = rows[0];

  return row ? outboxMutationFromRow(row) : null;
}

/** Reads one mutation or throws `OUTBOX_MUTATION_NOT_FOUND`. */
export async function readOutboxMutation(
  tx: LocalDatabaseTransaction,
  ownerId: string,
  clientMutationId: string,
): Promise<OutboxMutation> {
  const rows = await tx.select<LocalRow>(OUTBOX_TABLE, {
    where: { ownerId, clientMutationId },
    limit: 1,
  });
  const row = rows[0];

  if (!row) {
    throw new LocalDbError(LOCAL_DB_ERROR_CODES.OUTBOX_MUTATION_NOT_FOUND);
  }

  return outboxMutationFromRow(row);
}

/**
 * Next `seq` for the account, read and bumped inside the caller's transaction.
 * The counter never goes backwards, so draining the queue and enqueuing again
 * keeps ordering instead of restarting at 1.
 */
export async function nextOutboxSeq(
  tx: LocalDatabaseTransaction,
  ownerId: string,
): Promise<number> {
  const rows = await tx.select<LocalRow>(OUTBOX_SEQ_TABLE, {
    where: { ownerId },
    limit: 1,
  });
  const stored = rows[0]?.nextSeq;
  const seq = typeof stored === "number" && stored > 0 ? stored : 1;

  await tx.upsert(OUTBOX_SEQ_TABLE, { ownerId, nextSeq: seq + 1 });

  return seq;
}

export async function listOutboxRowsByOwner(
  tx: LocalDatabaseTransaction,
  ownerId: string,
): Promise<OutboxMutation[]> {
  const rows = await tx.select<LocalRow>(OUTBOX_TABLE, {
    where: { ownerId },
    orderBy: OUTBOX_SEQ_ASC,
  });

  return rows.map(outboxMutationFromRow);
}
