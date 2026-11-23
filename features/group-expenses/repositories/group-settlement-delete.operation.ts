import { runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { NotificationWrite } from "@/features/notifications/types/notification.types";
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
  }: SoftDeleteGroupSettlementOperationOptions,
  port: ISettlementMovementPort = new FirebaseSettlementMovementPort(),
): Promise<void> {
  const reference = groupSettlementRef(settlementId);
  let reverted = false;

  await runTransaction(db, async (transaction) => {
    const stored = readGroupSettlementDocument(
      settlementId,
      await transaction.get(reference),
    );

    if (stored.deletedAt !== null) return;

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
      });
    }

    const patch: Record<string, unknown> = {
      deletedAt,
      updatedAt: deletedAt,
    };

    // Only the creditor can clear the receiver link; the debtor's delete always
    // happens with an empty link, so the keys stay untouched there.
    if (viewerIsCreditor) {
      patch.receiverWalletId = null;
      patch.receiverCategoryId = null;
      patch.receiverTransactionId = null;
    }

    transaction.update(reference, patch);
    reverted = true;
  });

  if (reverted) await writeGroupSettlementNotification(notification);
}
