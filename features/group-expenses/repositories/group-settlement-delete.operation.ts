import { runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { nextRevision, readStoredRevision } from "@/shared/utils/revision";
import {
  assertExpectedRevision,
  readAppliedRevision,
  writeAppliedMutation,
  type SocialMutationContext,
} from "@/shared/services/sync/firestore-idempotency";
import { SyncMutationError } from "@/shared/services/sync/sync.errors";
import type { NotificationWrite } from "@/features/notifications/types/notification.types";
import { addGroupActivity } from "@/features/groups/repositories/group-activity.writes";
import { FirebaseSettlementMovementPort } from "@/features/settlements/repositories/firebase-settlement-movement.port";
import type { ISettlementMovementPort } from "@/features/settlements/repositories/settlement-movement.port";
import {
  readActiveSettlementMovement,
  readStoredSettlementMovement,
  revertSettlementMovementWallet,
  settlementMovementRef,
} from "@/features/settlements/repositories/settlement-movement.helpers";

import { GroupExpenseOperationError } from "../services/group-expense.errors";
import {
  groupSettlementError,
  readGroupSettlementDocument,
} from "./group-settlement-link.helpers";
import { writeGroupSettlementNotification } from "./group-settlement-notification-write";
import { groupSettlementRef } from "./group-settlements.operations";

export interface SoftDeleteGroupSettlementOperationOptions {
  viewerUid: string;
  settlementId: string;
  deletedAt: string;
  notification: NotificationWrite;
  /** Present only while draining the outbox. */
  sync?: SocialMutationContext;
}

/**
 * Soft delete reverts the creditor income exactly once. A debtor cannot revert a
 * movement they do not own, so that delete is rejected until the creditor
 * unlinks it. Idempotent: an already deleted settlement returns without touching
 * balances or writing another notification.
 */
export async function softDeleteGroupSettlementOperation(
  {
    viewerUid,
    settlementId,
    deletedAt,
    notification,
    sync,
  }: SoftDeleteGroupSettlementOperationOptions,
  port: ISettlementMovementPort = new FirebaseSettlementMovementPort(),
): Promise<void> {
  const reference = groupSettlementRef(settlementId);
  let reverted = false;

  await runTransaction(db, async (transaction) => {
    if (sync) {
      const replay = await readAppliedRevision(
        transaction,
        sync.ownerId,
        sync,
      );

      if (replay !== null) return;
    }

    const storedSnapshot = await transaction.get(reference);
    if (sync && !storedSnapshot.exists()) {
      throw new SyncMutationError("DELETED_REMOTELY");
    }

    const stored = readGroupSettlementDocument(settlementId, storedSnapshot);
    const revision = nextRevision(storedSnapshot.data());

    if (stored.deletedAt !== null) {
      if (sync) {
        writeAppliedMutation(transaction, {
          ownerId: sync.ownerId,
          context: sync,
          entityType: "group-settlement",
          entityId: settlementId,
          revisionAfter: readStoredRevision(stored),
          now: deletedAt,
        });
      }
      return;
    }

    if (sync) assertExpectedRevision(storedSnapshot.data() ?? {}, sync);

    const viewerIsCreditor = stored.toUserId === viewerUid;

    if (stored.receiverTransactionId !== null && !viewerIsCreditor) {
      throw new GroupExpenseOperationError("SETTLEMENT_HAS_RECEIVER_MOVEMENT");
    }

    const previousStored = viewerIsCreditor
      ? await readStoredSettlementMovement(transaction, stored, port)
      : null;
    const previous = readActiveSettlementMovement(previousStored);

    if (previous && previousStored) {
      await revertSettlementMovementWallet(
        transaction,
        previous,
        stored.toUserId,
        stored.currency,
        deletedAt,
        port,
        groupSettlementError,
      );
      transaction.update(settlementMovementRef(previousStored.id), {
        deletedAt,
        updatedAt: deletedAt,
        revision: nextRevision(previousStored),
      });
    }

    const patch: Record<string, unknown> = {
      deletedAt,
      updatedAt: deletedAt,
      revision,
    };

    // Only the creditor can clear the receiver link; the debtor's delete always
    // happens with an empty link, so the keys stay untouched there.
    if (viewerIsCreditor) {
      patch.receiverWalletId = null;
      patch.receiverCategoryId = null;
      patch.receiverTransactionId = null;
    }

    transaction.update(reference, patch);
    addGroupActivity(transaction, {
      type: "settlement-deleted",
      groupId: stored.groupId,
      actorId: viewerUid,
      settlementId,
      fromUserId: stored.fromUserId,
      toUserId: stored.toUserId,
      amountCents: stored.amountCents,
      currency: stored.currency,
      description: stored.note,
      createdAt: deletedAt,
    });
    reverted = true;

    if (sync) {
      writeAppliedMutation(transaction, {
        ownerId: sync.ownerId,
        context: sync,
        entityType: "group-settlement",
        entityId: settlementId,
        revisionAfter: revision,
        now: deletedAt,
      });
    }
  });

  if (reverted) await writeGroupSettlementNotification(notification);
}
