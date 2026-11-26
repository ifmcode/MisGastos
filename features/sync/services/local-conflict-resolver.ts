import { LocalConflictRepository } from "@/shared/lib/local-db/local-conflict.repository";
import {
  LOCAL_DB_ERROR_CODES,
  LocalDbError,
} from "@/shared/lib/local-db/local-db.errors";
import {
  applyRemoteRecord,
  deleteLocalRecord,
  markRecordSynced,
  setRecordSyncStatus,
} from "@/shared/lib/local-db/local-record-sync";
import { getLocalDatabase } from "@/shared/lib/local-db/local-db.runtime";
import type {
  LocalConflictResolution,
  OutboxMutation,
} from "@/shared/lib/local-db/local-db.types";
import { LocalOutboxRepository } from "@/shared/lib/local-db/local-outbox.repository";
import {
  planConflictResolution,
  readRemoteRevision,
} from "@/shared/services/sync/sync.conflict-policy";

function requireMutation(
  mutation: OutboxMutation | null,
): OutboxMutation {
  if (!mutation) {
    throw new LocalDbError(LOCAL_DB_ERROR_CODES.OUTBOX_MUTATION_NOT_FOUND);
  }

  return mutation;
}

/**
 * Applies an explicit user decision to one conflict. Everything happens in one
 * local transaction: the local record, the outbox payload and the conflict row
 * move together, so a crash cannot resolve half of the decision.
 */
export async function resolveLocalConflict(
  ownerId: string,
  conflictId: string,
  choice: LocalConflictResolution,
  now: string = new Date().toISOString(),
): Promise<void> {
  const port = await getLocalDatabase();
  if (!port) throw new LocalDbError(LOCAL_DB_ERROR_CODES.OPEN_FAILED);

  const conflicts = new LocalConflictRepository(port);
  const outbox = new LocalOutboxRepository(port);

  await port.transaction(async (tx) => {
    const conflict = await conflicts.findById(ownerId, conflictId, tx);
    if (!conflict) {
      throw new LocalDbError(LOCAL_DB_ERROR_CODES.CONFLICT_NOT_FOUND);
    }

    const mutation = requireMutation(
      await outbox.findById(ownerId, conflict.clientMutationId, tx),
    );
    const plan = planConflictResolution({ conflict, mutation, choice });

    if (!plan.ok) throw new Error(plan.errorCode);

    if (plan.requeue) {
      await outbox.rebase(
        ownerId,
        mutation.clientMutationId,
        { ...plan.requeue, now },
        tx,
      );
    } else {
      await outbox.remove(ownerId, mutation.clientMutationId, tx);
    }

    if (plan.applyRemote) {
      await applyRemoteRecord(
        tx,
        conflict.entityType,
        ownerId,
        conflict.entityId,
        conflict.remoteSnapshot,
        now,
      );
    }

    if (plan.removeLocal) {
      await deleteLocalRecord(
        tx,
        conflict.entityType,
        ownerId,
        conflict.entityId,
      );
    }

    if (plan.markLocalSynced) {
      await markRecordSynced(
        tx,
        conflict.entityType,
        ownerId,
        conflict.entityId,
        readRemoteRevision(conflict.remoteSnapshot),
        now,
      );
    }

    if (plan.requeue) {
      await setRecordSyncStatus(
        tx,
        conflict.entityType,
        ownerId,
        conflict.entityId,
        "pending",
        now,
      );
    }

    await conflicts.resolve(ownerId, conflictId, choice, now, tx);
  });
}
