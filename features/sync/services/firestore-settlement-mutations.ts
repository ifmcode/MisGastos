import {
  createSettlementOperation,
  type SettlementMutationOptions,
} from "@/features/settlements/repositories/settlement-create.operation";
import { softDeleteSettlementOperation } from "@/features/settlements/repositories/settlement-delete.operation";
import { updateSettlementOperation } from "@/features/settlements/repositories/settlement-update.operation";
import type { OutboxMutation } from "@/shared/lib/local-db/local-db.types";
import { nextRevision } from "@/shared/utils/revision";
import { SyncMutationError } from "@/shared/services/sync/sync.errors";
import type { RemoteMutationOutcome } from "@/shared/services/sync/sync.types";

import {
  readNotification,
  readSettlementCreateDto,
  readSettlementUpdateDto,
} from "./social-mutation-snapshots";
import { toSocialContext } from "./sync-executor.helpers";

/** Applies one queued 1:1 settlement through the shared server operation. */
export async function executeSettlementMutation(
  mutation: OutboxMutation,
): Promise<RemoteMutationOutcome> {
  const sync = toSocialContext(mutation);
  const settlementId = mutation.entityId;

  if (mutation.operation === "delete") {
    const deletedAt =
      typeof mutation.localSnapshot.deletedAt === "string"
        ? mutation.localSnapshot.deletedAt
        : mutation.updatedAt;

    await softDeleteSettlementOperation({
      viewerUid: mutation.ownerId,
      settlementId,
      deletedAt,
      notification: readNotification(mutation.localSnapshot),
      sync,
    });

    return {
      status: "applied",
      revisionAfter: nextRevision(mutation.serverSnapshot),
      wallets: [],
    };
  }

  if (mutation.operation === "update") {
    const result = await updateSettlementOperation({
      viewerUid: mutation.ownerId,
      settlementId,
      update: readSettlementUpdateDto(mutation.localSnapshot),
      notification: readNotification(mutation.localSnapshot),
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

  const notification = readNotification(mutation.localSnapshot);
  const options: SettlementMutationOptions = { id: settlementId, sync };
  const result = await createSettlementOperation(
    readSettlementCreateDto(mutation.localSnapshot),
    () => notification,
    undefined,
    options,
  );

  return {
    status: "applied",
    revisionAfter: result.revision,
    wallets: [],
  };
}
