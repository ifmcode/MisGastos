import type { OutboxMutation } from "@/shared/lib/local-db/local-db.types";
import { classifySyncError } from "@/shared/services/sync/sync.errors";
import type {
  RemoteMutationExecutor,
  RemoteMutationOutcome,
} from "@/shared/services/sync/sync.types";

import { executeGroupExpenseMutation } from "./firestore-group-expense-mutations";
import { executeGroupSettlementMutation } from "./firestore-group-settlement-mutations";
import { executeSettlementMutation } from "./firestore-settlement-mutations";
import { executeSharedExpenseMutation } from "./firestore-shared-expense-mutations";
import { executeTransactionMutation } from "./firestore-transaction-mutations";
import { executeTransferMutation } from "./firestore-transfer-mutations";
import { readRemoteSnapshot } from "./sync-executor.helpers";

/**
 * Applies queued mutations through the existing idempotent server operations.
 * The executor only translates the outbox payload; balance rules stay in the
 * operations, shared by the online and the offline path.
 */
export class FirestoreSyncExecutor implements RemoteMutationExecutor {
  async execute(mutation: OutboxMutation): Promise<RemoteMutationOutcome> {
    try {
      if (mutation.entityType === "transaction") {
        return await executeTransactionMutation(mutation);
      }
      if (mutation.entityType === "transfer") {
        return await executeTransferMutation(mutation);
      }
      if (mutation.entityType === "shared-expense") {
        return await executeSharedExpenseMutation(mutation);
      }
      if (mutation.entityType === "settlement") {
        return await executeSettlementMutation(mutation);
      }
      if (mutation.entityType === "group-expense") {
        return await executeGroupExpenseMutation(mutation);
      }
      if (mutation.entityType === "group-settlement") {
        return await executeGroupSettlementMutation(mutation);
      }

      return { status: "failed", errorCode: "SYNC_UNSUPPORTED_ENTITY" };
    } catch (error) {
      return this.toOutcome(error, mutation);
    }
  }

  private async toOutcome(
    error: unknown,
    mutation: OutboxMutation,
  ): Promise<RemoteMutationOutcome> {
    const classification = classifySyncError(error);

    if (classification.status !== "conflict") return classification;

    const remoteSnapshot = await readRemoteSnapshot(mutation);

    // A remote delete is the only kind where an unreadable document is the
    // expected answer. For the others, storing an empty snapshot would make
    // "keep remote" delete a local record that may still exist, so the cycle is
    // retried instead.
    if (remoteSnapshot === null && classification.kind !== "DELETED_REMOTELY") {
      return { status: "retry", errorCode: "SYNC_REMOTE_SNAPSHOT_UNAVAILABLE" };
    }

    return {
      status: "conflict",
      kind: classification.kind,
      errorCode: classification.errorCode,
      remoteSnapshot: remoteSnapshot ?? {},
    };
  }
}
