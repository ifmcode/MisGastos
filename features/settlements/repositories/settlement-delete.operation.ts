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
import {
  createNotificationDocumentId,
  toNotificationData,
} from "@/features/notifications/repositories/notifications.data";
import { notificationRef } from "@/features/notifications/repositories/notifications.operations";
import type { NotificationWrite } from "@/features/notifications/types/notification.types";

import { SettlementOperationError } from "../services/settlement.errors";
import { FirebaseSettlementMovementPort } from "./firebase-settlement-movement.port";
import type { ISettlementMovementPort } from "./settlement-movement.port";
import {
  readActiveSettlementMovement,
  readStoredSettlementMovement,
  revertSettlementMovementWallet,
  settlementMovementRef,
} from "./settlement-movement.helpers";
import { readSettlementDocument } from "./settlement-wallet.helpers";
import { settlementRef } from "./settlements.operations";

export interface SoftDeleteSettlementOperationOptions {
  viewerUid: string;
  settlementId: string;
  deletedAt: string;
  notification: NotificationWrite;
  /** Present only while draining the outbox. */
  sync?: SocialMutationContext;
}

/**
 * Soft delete reverts the creditor income exactly once. A debtor cannot revert
 * a movement they do not own (rules would deny the wallet write), so the delete
 * is rejected with a stable code until the creditor unlinks it.
 *
 * Idempotent: an already deleted settlement returns without touching balances
 * or writing another notification.
 */
export async function softDeleteSettlementOperation(
  {
    viewerUid,
    settlementId,
    deletedAt,
    notification,
    sync,
  }: SoftDeleteSettlementOperationOptions,
  port: ISettlementMovementPort = new FirebaseSettlementMovementPort(),
): Promise<void> {
  const reference = settlementRef(settlementId);
  const notificationDocument = notificationRef(
    createNotificationDocumentId(notification.dedupeKey),
  );

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

    const stored = readSettlementDocument(settlementId, storedSnapshot);
    const revision = nextRevision(stored);

    if (stored.deletedAt !== null) {
      if (sync) {
        writeAppliedMutation(transaction, {
          ownerId: sync.ownerId,
          context: sync,
          entityType: "settlement",
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
      throw new SettlementOperationError("SETTLEMENT_HAS_RECEIVER_MOVEMENT");
    }

    const previousStored = viewerIsCreditor
      ? await readStoredSettlementMovement(transaction, stored, port)
      : null;
    const previous = readActiveSettlementMovement(previousStored);
    const notificationSnapshot = await transaction.get(notificationDocument);

    if (previous && previousStored) {
      await revertSettlementMovementWallet(
        transaction,
        previous,
        stored.toUserId,
        stored.currency,
        deletedAt,
        port,
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

    if (!notificationSnapshot.exists()) {
      transaction.set(notificationDocument, toNotificationData(notification));
    }

    if (sync) {
      writeAppliedMutation(transaction, {
        ownerId: sync.ownerId,
        context: sync,
        entityType: "settlement",
        entityId: settlementId,
        revisionAfter: revision,
        now: deletedAt,
      });
    }
  });
}
