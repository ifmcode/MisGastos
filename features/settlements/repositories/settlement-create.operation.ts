import { doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { INITIAL_REVISION, nextRevision } from "@/shared/utils/revision";
import {
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

import { SettlementOperationError } from "../services/settlement.errors";
import type {
  CreateSettlementDto,
  Settlement,
} from "../types/settlement.types";
import { FirebaseSettlementMovementPort } from "./firebase-settlement-movement.port";
import type { ISettlementMovementPort } from "./settlement-movement.port";
import {
  newSettlementMovementRef,
  resolveSettlementMovementConcept,
  settlementWalletRef,
} from "./settlement-movement.helpers";
import {
  assertSettlementLinkShape,
  readSettlementWallet,
} from "./settlement-wallet.helpers";
import { toSettlementData } from "./settlements.data";
import { mapSettlementDocument } from "./settlements.mapper";
import { SETTLEMENTS_COLLECTION, newSettlementRef } from "./settlements.operations";
import type { SettlementNotificationBuilder } from "./settlements.repository";

/** Inputs the sync executor adds to the otherwise unchanged server operation. */
export interface SettlementMutationOptions {
  id?: string;
  sync?: SocialMutationContext;
}

/**
 * Creates the settlement, its optional creditor income and the counterpart
 * notification in one transaction. The wallet is validated inside it, so an
 * invalid wallet writes nothing at all.
 *
 * The notification arrives as a builder because its deterministic `dedupeKey`
 * needs the generated settlement id.
 */
export async function createSettlementOperation(
  dto: CreateSettlementDto,
  notification: SettlementNotificationBuilder,
  port: ISettlementMovementPort = new FirebaseSettlementMovementPort(),
  options: SettlementMutationOptions = {},
): Promise<Settlement> {
  assertSettlementLinkShape(dto.receiverWalletId, dto.receiverCategoryId);

  const now = dto.updatedAt;
  const settlementDocument = options.id
    ? doc(db, SETTLEMENTS_COLLECTION, options.id)
    : newSettlementRef();
  const walletId = dto.receiverWalletId;
  const movementDocument =
    walletId === null ? null : newSettlementMovementRef();

  const settlement: Settlement = {
    id: settlementDocument.id,
    ...dto,
    receiverTransactionId: movementDocument ? movementDocument.id : null,
    revision: 0,
  };
  const event = notification(settlement);
  const notificationDocument = notificationRef(
    createNotificationDocumentId(event.dedupeKey),
  );

  let created: Settlement | null = null;

  await runTransaction(db, async (transaction) => {
    if (options.sync) {
      const replay = await readAppliedRevision(
        transaction,
        options.sync.ownerId,
        options.sync,
      );

      if (replay !== null) {
        const snapshot = await transaction.get(settlementDocument);
        created = snapshot.exists()
          ? mapSettlementDocument(
              settlementDocument.id,
              snapshot.data() as Record<string, unknown>,
            )
          : null;
        return;
      }
    }

    const notificationSnapshot = await transaction.get(notificationDocument);
    const walletSnapshot =
      walletId === null
        ? null
        : await transaction.get(settlementWalletRef(walletId));
    const balance =
      walletId === null || walletSnapshot === null
        ? 0
        : readSettlementWallet(walletSnapshot, dto.toUserId, dto.currency);

    const data = toSettlementData(settlement);
    transaction.set(settlementDocument, data);

    if (walletId !== null && movementDocument !== null) {
      transaction.set(
        movementDocument,
        port.buildCreateData({
          movementId: movementDocument.id,
          ownerId: dto.toUserId,
          walletId,
          settlementId: settlement.id,
          amountCents: dto.amountCents,
          currency: dto.currency,
          categoryId: dto.receiverCategoryId ?? "",
          concept: resolveSettlementMovementConcept(dto.note),
          date: dto.date,
          createdAt: now,
          updatedAt: now,
        }),
      );
      transaction.update(settlementWalletRef(walletId), {
        balance: port.applyAmountToBalance(balance, dto.amountCents),
        updatedAt: now,
        revision: nextRevision(walletSnapshot?.data()),
      });
    }

    if (!notificationSnapshot.exists()) {
      transaction.set(notificationDocument, toNotificationData(event));
    }

    if (options.sync) {
      writeAppliedMutation(transaction, {
        ownerId: options.sync.ownerId,
        context: options.sync,
        entityType: "settlement",
        entityId: settlement.id,
        revisionAfter: INITIAL_REVISION,
        now,
      });
    }

    created = mapSettlementDocument(settlement.id, data);
  });

  if (!created) throw new SettlementOperationError("SETTLEMENT_NOT_FOUND");

  return created;
}
