import { createTransferOperation } from "@/features/transfers/repositories/transfer-create.operation";
import { deleteTransferOperation } from "@/features/transfers/repositories/transfer-delete.operation";
import { updateTransferOperation } from "@/features/transfers/repositories/transfer-update.operation";
import type { OutboxMutation } from "@/shared/lib/local-db/local-db.types";
import { SyncMutationError } from "@/shared/services/sync/sync.errors";
import type { RemoteMutationOutcome } from "@/shared/services/sync/sync.types";

import { readTransferDto } from "./sync-mutation-snapshots";
import { toMutationContext, toRemoteWallets } from "./sync-executor.helpers";

/** Applies one queued transfer through the shared server operation. */
export async function executeTransferMutation(
  mutation: OutboxMutation,
): Promise<RemoteMutationOutcome> {
  const context = toMutationContext(mutation);

  if (mutation.operation === "delete") {
    const result = await deleteTransferOperation(
      mutation.ownerId,
      mutation.entityId,
      context,
    );

    return {
      status: "applied",
      revisionAfter: result.transfer.revision,
      wallets: toRemoteWallets(result.wallets),
    };
  }

  const dto = readTransferDto(mutation.localSnapshot);

  if (mutation.operation === "update") {
    const result = await updateTransferOperation({
      ownerId: mutation.ownerId,
      transferId: mutation.entityId,
      dto,
      mutation: context,
    });

    return {
      status: "applied",
      revisionAfter: result.transfer.revision,
      wallets: toRemoteWallets(result.wallets),
    };
  }

  if (mutation.operation !== "create") {
    throw new SyncMutationError("INVALID", "SYNC_OPERATION_INVALID");
  }

  const result = await createTransferOperation(mutation.ownerId, dto, context);

  return {
    status: "applied",
    revisionAfter: result.transfer.revision,
    wallets: toRemoteWallets(result.wallets),
  };
}
