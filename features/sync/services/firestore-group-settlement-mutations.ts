import { createGroupSettlementOperation } from "@/features/group-expenses/repositories/group-settlement-create.operation";
import { softDeleteGroupSettlementOperation } from "@/features/group-expenses/repositories/group-settlement-delete.operation";
import { updateGroupSettlementOperation } from "@/features/group-expenses/repositories/group-settlement-update.operation";
import type { NotificationWrite } from "@/features/notifications/types/notification.types";
import type { OutboxMutation } from "@/shared/lib/local-db/local-db.types";
import { nextRevision } from "@/shared/utils/revision";
import { SyncMutationError } from "@/shared/services/sync/sync.errors";
import type { RemoteMutationOutcome } from "@/shared/services/sync/sync.types";

import {
  readGroupSettlementCreateDto,
  readGroupSettlementUpdateDto,
} from "./social-group-mutation-snapshots";
import { readNotification } from "./social-mutation-snapshots";
import { toSocialContext } from "./sync-executor.helpers";

/** Applies one queued group settlement through the shared server operation. */
export async function executeGroupSettlementMutation(
  mutation: OutboxMutation,
): Promise<RemoteMutationOutcome> {
  const sync = toSocialContext(mutation);
  const settlementId = mutation.entityId;
  const notification = readNotification(mutation.localSnapshot);

  if (mutation.operation === "delete") {
    const deletedAt =
      typeof mutation.localSnapshot.deletedAt === "string"
        ? mutation.localSnapshot.deletedAt
        : mutation.updatedAt;

    await softDeleteGroupSettlementOperation({
      viewerUid: mutation.ownerId,
      settlementId,
      deletedAt,
      notification,
      sync,
    });

    return {
      status: "applied",
      revisionAfter: nextRevision(mutation.serverSnapshot),
      wallets: [],
    };
  }

  if (mutation.operation === "update") {
    const result = await updateGroupSettlementOperation({
      viewerUid: mutation.ownerId,
      settlementId,
      update: readGroupSettlementUpdateDto(mutation.localSnapshot),
      notification,
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

  const result = await createGroupSettlementOperation(
    readGroupSettlementCreateDto(mutation.localSnapshot),
    () => notification as NotificationWrite,
    undefined,
    { id: settlementId, sync },
  );

  return {
    status: "applied",
    revisionAfter: result.revision,
    wallets: [],
  };
}
