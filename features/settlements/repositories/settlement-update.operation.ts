import { runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  assertExpectedRevision,
  readAppliedRevision,
  writeAppliedMutation,
  type SocialMutationContext,
} from "@/shared/services/sync/firestore-idempotency";
import { SyncMutationError } from "@/shared/services/sync/sync.errors";
import { nextRevision } from "@/shared/utils/revision";
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
  /** Present only while draining the outbox. */
  sync?: SocialMutationContext;
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
    sync,
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
    if (sync) {
      const replay = await readAppliedRevision(
        transaction,
        sync.ownerId,
        sync,
      );

      if (replay !== null) {
        const snapshot = await transaction.get(reference);
        result = snapshot.exists()
          ? mapSettlementDocument(
              settlementId,
              snapshot.data() as Record<string, unknown>,
            )
          : null;
        return;
      }
    }

    const storedSnapshot = await transaction.get(reference);
    if (sync && !storedSnapshot.exists()) {
      throw new SyncMutationError("DELETED_REMOTELY");
    }

    if (sync) assertExpectedRevision(storedSnapshot.data() ?? {}, sync);

    const stored = readSettlementDocument(settlementId, storedSnapshot);

    if (stored.deletedAt !== null) {
      throw sync
        ? new SyncMutationError("DELETED_REMOTELY")
        : new SettlementOperationError("ALREADY_DELETED");
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

    const patch = {
      ...toSettlementUpdateData({
        ...update,
        receiverWalletId: edit.destinationWalletId,
        receiverCategoryId: edit.destinationCategoryId,
        receiverTransactionId: linkedId,
      }),
      revision: nextRevision(stored),
    };
    transaction.update(reference, patch);
    result = mapSettlementDocument(settlementId, { ...stored, ...patch });

    if (!notificationSnapshot.exists()) {
      transaction.set(notificationDocument, toNotificationData(notification));
    }

    if (sync) {
      writeAppliedMutation(transaction, {
        ownerId: sync.ownerId,
        context: sync,
        entityType: "settlement",
        entityId: settlementId,
        revisionAfter: patch.revision,
        now,
      });
    }
  });

  if (!result) throw new SettlementOperationError("SETTLEMENT_NOT_FOUND");

  return result;
}
