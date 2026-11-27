import {
  createGroupExpenseLinkOperation,
  softDeleteGroupExpenseLinkOperation,
  updateGroupExpenseLinkOperation,
} from "@/features/group-expenses/repositories/group-expense-link.operations";
import { createGroupExpenseOperation } from "@/features/group-expenses/repositories/group-expenses.operations";
import type { OutboxMutation } from "@/shared/lib/local-db/local-db.types";
import { nextRevision } from "@/shared/utils/revision";
import { SyncMutationError } from "@/shared/services/sync/sync.errors";
import type { RemoteMutationOutcome } from "@/shared/services/sync/sync.types";

import {
  readGroupExpenseCreateDto,
  readGroupExpenseUpdateDto,
} from "./social-group-mutation-snapshots";
import { toSocialContext } from "./sync-executor.helpers";

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isLinked(mutation: OutboxMutation): boolean {
  return (
    hasText(mutation.localSnapshot.walletId) ||
    hasText(mutation.localSnapshot.linkedTransactionId) ||
    hasText(mutation.serverSnapshot.walletId) ||
    hasText(mutation.serverSnapshot.linkedTransactionId)
  );
}

/** Applies one queued group expense through the shared server operation. */
export async function executeGroupExpenseMutation(
  mutation: OutboxMutation,
): Promise<RemoteMutationOutcome> {
  const sync = toSocialContext(mutation);
  const expenseId = mutation.entityId;

  if (mutation.operation === "delete") {
    const deletedAt =
      typeof mutation.localSnapshot.deletedAt === "string"
        ? mutation.localSnapshot.deletedAt
        : mutation.updatedAt;

    // The linked operation reads the stored link and reverts it exactly once;
    // a stale local snapshot cannot orphan a movement from another device.
    await softDeleteGroupExpenseLinkOperation({
      viewerUid: mutation.ownerId,
      expenseId,
      deletedAt,
      sync,
    });

    return {
      status: "applied",
      revisionAfter: nextRevision(mutation.serverSnapshot),
      wallets: [],
    };
  }

  if (mutation.operation === "update") {
    const result = await updateGroupExpenseLinkOperation({
      viewerUid: mutation.ownerId,
      expenseId,
      update: readGroupExpenseUpdateDto(mutation.localSnapshot),
      sync,
    });

    return {
      status: "applied",
      revisionAfter: result.revision,
      wallets: [],
    };
  }

  if (mutation.operation !== "create") {
    throw new SyncMutationError("INVALID", "SYNC_OPERATION_INVALID");
  }

  const dto = readGroupExpenseCreateDto(mutation.localSnapshot);
  const result = isLinked(mutation)
    ? await createGroupExpenseLinkOperation(dto, undefined, {
        id: expenseId,
        sync,
      })
    : await createGroupExpenseOperation(dto, { id: expenseId, sync });

  return {
    status: "applied",
    revisionAfter: result.revision,
    wallets: [],
  };
}
