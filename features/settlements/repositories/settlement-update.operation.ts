import { runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  createNotificationDocumentId,
  toNotificationData,
} from "@/features/notifications/repositories/notifications.data";
import { notificationRef } from "@/features/notifications/repositories/notifications.operations";
import type { NotificationWrite } from "@/features/notifications/types/notification.types";

import { SettlementOperationError } from "../services/settlement.errors";
import type {
  Settlement,
  UpdateSettlementDto,
} from "../types/settlement.types";
import { FirebaseSettlementMovementPort } from "./firebase-settlement-movement.port";
import type { ISettlementMovementPort } from "./settlement-movement.port";
import {
  readActiveSettlementMovement,
  readStoredSettlementMovement,
} from "./settlement-movement.helpers";
import {
  softDeleteSettlementMovement,
  writeSettlementMovement,
} from "./settlement-movement-write";
import {
  assertLinkChangeAllowed,
  resolveSettlementEdit,
} from "./settlement-update.resolve";
import { applySettlementWalletEffects } from "./settlement-wallet-effects";
import {
  assertSettlementLinkShape,
  readSettlementDocument,
} from "./settlement-wallet.helpers";
import { toSettlementUpdateData } from "./settlements.data";
import { mapSettlementDocument } from "./settlements.mapper";
import { settlementRef } from "./settlements.operations";

export interface UpdateSettlementOperationOptions {
  viewerUid: string;
  settlementId: string;
  update: UpdateSettlementDto;
  notification: NotificationWrite;
}

/**
 * Syncs every mutable field of a settlement with its single income movement.
 * The previous wallet effect is reverted and the new one applied inside the
 * same transaction, so a repeated edit never double-counts the balance.
 */
export async function updateSettlementOperation(
  {
    viewerUid,
    settlementId,
    update,
    notification,
  }: UpdateSettlementOperationOptions,
  port: ISettlementMovementPort = new FirebaseSettlementMovementPort(),
): Promise<Settlement> {
  assertSettlementLinkShape(update.receiverWalletId, update.receiverCategoryId);

  const now = update.updatedAt;
  const reference = settlementRef(settlementId);
  const notificationDocument = notificationRef(
    createNotificationDocumentId(notification.dedupeKey),
  );
  let result: Settlement | null = null;

  await runTransaction(db, async (transaction) => {
    const stored = readSettlementDocument(
      settlementId,
      await transaction.get(reference),
    );

    if (stored.deletedAt !== null) {
      throw new SettlementOperationError("ALREADY_DELETED");
    }

    const viewerIsCreditor = stored.toUserId === viewerUid;
    assertLinkChangeAllowed(stored, update, viewerIsCreditor);

    // The other participant's movement is owner-only, so the debtor never reads
    // it: rules would deny the read and nothing may change on that side anyway.
    const previousStored = viewerIsCreditor
      ? await readStoredSettlementMovement(transaction, stored, port)
      : null;

    const edit = resolveSettlementEdit(
      stored,
      update,
      viewerIsCreditor,
      readActiveSettlementMovement(previousStored),
    );
    const notificationSnapshot = await transaction.get(notificationDocument);

    await applySettlementWalletEffects(
      transaction,
      edit,
      stored.toUserId,
      stored.currency,
      now,
      port,
    );

    let linkedId = stored.receiverTransactionId;

    if (viewerIsCreditor) {
      if (edit.wantsLink && edit.destinationWalletId !== null) {
        linkedId = writeSettlementMovement(
          transaction,
          stored,
          {
            walletId: edit.destinationWalletId,
            amountCents: update.amountCents,
            categoryId: edit.destinationCategoryId ?? "",
            note: update.note,
            date: update.date,
          },
          previousStored,
          { creditorId: stored.toUserId, port, now },
        );
      } else {
        linkedId = null;
        softDeleteSettlementMovement(transaction, previousStored, now);
      }
    }

    const patch = toSettlementUpdateData({
      ...update,
      receiverWalletId: edit.destinationWalletId,
      receiverCategoryId: edit.destinationCategoryId,
      receiverTransactionId: linkedId,
    });
    transaction.update(reference, patch);
    result = mapSettlementDocument(settlementId, { ...stored, ...patch });

    if (!notificationSnapshot.exists()) {
      transaction.set(notificationDocument, toNotificationData(notification));
    }
  });

  if (!result) throw new SettlementOperationError("SETTLEMENT_NOT_FOUND");

  return result;
}
