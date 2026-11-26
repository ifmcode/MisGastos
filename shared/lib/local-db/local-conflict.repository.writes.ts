import type {
  DatabasePort,
  LocalDatabaseTransaction,
} from "./database.port";
import { conflictFromRow, conflictToRow } from "./conflict.mapper";
import { LOCAL_DB_ERROR_CODES, LocalDbError } from "./local-db.errors";
import type {
  LocalConflict,
  LocalConflictInput,
  LocalConflictResolution,
  LocalRow,
} from "./local-db.types";
import { runInLocalTransaction } from "./local-transaction";

const TABLE = "conflicts" as const;

function readConflictId(input: LocalConflictInput): string {
  const provided = input.id?.trim();
  return provided && provided.length > 0
    ? provided
    : `${input.ownerId}__${input.clientMutationId}`;
}

/** Inserts the conflict or refreshes the open one of the same mutation. */
export async function createLocalConflict(
  port: DatabasePort,
  tx: LocalDatabaseTransaction | undefined,
  input: LocalConflictInput,
): Promise<LocalConflict> {
  return runInLocalTransaction(port, tx, async (active) => {
    const conflict: LocalConflict = {
      id: readConflictId(input),
      ownerId: input.ownerId,
      clientMutationId: input.clientMutationId,
      entityType: input.entityType,
      entityId: input.entityId,
      kind: input.kind,
      localSnapshot: input.localSnapshot,
      remoteSnapshot: input.remoteSnapshot,
      detectedAt: input.detectedAt,
      resolvedAt: null,
      resolution: null,
    };

    await active.upsert(TABLE, conflictToRow(conflict));

    return conflict;
  });
}

/** Stamps the explicit user decision; the row is kept as evidence. */
export async function resolveLocalConflictRow(
  port: DatabasePort,
  tx: LocalDatabaseTransaction | undefined,
  ownerId: string,
  conflictId: string,
  resolution: LocalConflictResolution,
  now: string,
): Promise<LocalConflict> {
  return runInLocalTransaction(port, tx, async (active) => {
    const rows = await active.select<LocalRow>(TABLE, {
      where: { ownerId, id: conflictId },
      limit: 1,
    });
    const row = rows[0];

    if (!row) {
      throw new LocalDbError(LOCAL_DB_ERROR_CODES.CONFLICT_NOT_FOUND);
    }

    const resolved: LocalConflict = {
      ...conflictFromRow(row),
      resolvedAt: now,
      resolution,
    };

    await active.upsert(TABLE, conflictToRow(resolved));

    return resolved;
  });
}

/** Account purge: every conflict of that owner disappears. */
export async function removeConflictsByOwner(
  port: DatabasePort,
  tx: LocalDatabaseTransaction | undefined,
  ownerId: string,
): Promise<void> {
  await runInLocalTransaction(port, tx, async (active) => {
    await active.delete(TABLE, { ownerId });
  });
}
