import {
  createSharedExpenseLinkOperation,
  softDeleteSharedExpenseLinkOperation,
  updateSharedExpenseLinkOperation,
} from "@/features/shared-expenses/repositories/shared-expense-link.operations";
import { createSharedExpenseOperation } from "@/features/shared-expenses/repositories/shared-expenses.operations";
import type { OutboxMutation } from "@/shared/lib/local-db/local-db.types";
import { nextRevision } from "@/shared/utils/revision";
import { SyncMutationError } from "@/shared/services/sync/sync.errors";
import type { RemoteMutationOutcome } from "@/shared/services/sync/sync.types";

import { toSocialContext } from "./sync-executor.helpers";
import {
  readSharedExpenseCreateDto,
  readSharedExpenseUpdateDto,
} from "./social-mutation-snapshots";

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

/** Applies one queued 1:1 shared expense through the shared server operation. */
export async function executeSharedExpenseMutation(
  mutation: OutboxMutation,
): Promise<RemoteMutationOutcome> {
  const sync = toSocialContext(mutation);
  const expenseId = mutation.entityId;

  if (mutation.operation === "delete") {
    const deletedAt =
      typeof mutation.localSnapshot.deletedAt === "string"
        ? mutation.localSnapshot.deletedAt
        : mutation.updatedAt;

    // Always the linked operation: it reads the stored link and reverts the
    // movement exactly once. A stale local snapshot must never orphan a wallet
    // movement created by another device.
    await softDeleteSharedExpenseLinkOperation({
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
    const result = await updateSharedExpenseLinkOperation({
      viewerUid: mutation.ownerId,
      expenseId,
      update: readSharedExpenseUpdateDto(mutation.localSnapshot),
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

  const dto = readSharedExpenseCreateDto(mutation.localSnapshot);
  const result = isLinked(mutation)
    ? await createSharedExpenseLinkOperation(dto, undefined, {
        id: expenseId,
        sync,
      })
    : await createSharedExpenseOperation(dto, { id: expenseId, sync });

  return {
    status: "applied",
    revisionAfter: result.revision,
    wallets: [],
  };
}
