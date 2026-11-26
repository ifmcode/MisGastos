import { createTransactionOperation } from "@/features/transactions/repositories/transaction-create.operation";
import { deleteTransactionOperation } from "@/features/transactions/repositories/transaction-delete.operation";
import { updateTransactionOperation } from "@/features/transactions/repositories/transaction-update.operation";
import type { OutboxMutation } from "@/shared/lib/local-db/local-db.types";
import { SyncMutationError } from "@/shared/services/sync/sync.errors";
import type { RemoteMutationOutcome } from "@/shared/services/sync/sync.types";

import { readTransactionDto } from "./sync-mutation-snapshots";
import { toMutationContext, toRemoteWallets } from "./sync-executor.helpers";

/** Applies one queued personal movement through the shared server operation. */
export async function executeTransactionMutation(
  mutation: OutboxMutation,
): Promise<RemoteMutationOutcome> {
  const context = toMutationContext(mutation);

  if (mutation.operation === "delete") {
    const result = await deleteTransactionOperation(
      mutation.ownerId,
      mutation.entityId,
      context,
    );

    return {
      status: "applied",
      revisionAfter: result.transaction.revision,
      wallets: toRemoteWallets(result.wallets),
    };
  }

  const dto = readTransactionDto(mutation.localSnapshot);

  if (mutation.operation === "update") {
    const result = await updateTransactionOperation({
      ownerId: mutation.ownerId,
      transactionId: mutation.entityId,
      dto,
      mutation: context,
    });

    return {
      status: "applied",
      revisionAfter: result.transaction.revision,
      wallets: toRemoteWallets(result.wallets),
    };
  }

  if (mutation.operation !== "create") {
    throw new SyncMutationError("INVALID", "SYNC_OPERATION_INVALID");
  }

  const result = await createTransactionOperation(
    mutation.ownerId,
    dto,
    context,
  );

  return {
    status: "applied",
    revisionAfter: result.transaction.revision,
    wallets: toRemoteWallets(result.wallets),
  };
}
