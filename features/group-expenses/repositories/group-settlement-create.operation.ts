import { runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { nextRevision } from "@/shared/utils/revision";
import { addGroupActivity } from "@/features/groups/repositories/group-activity.writes";

import { GroupExpenseOperationError } from "../services/group-expense.errors";
import type {
  CreateGroupSettlementDto,
  GroupSettlement,
} from "../types/group-settlement.types";
import { FirebaseSettlementMovementPort } from "@/features/settlements/repositories/firebase-settlement-movement.port";
import type { ISettlementMovementPort } from "@/features/settlements/repositories/settlement-movement.port";
import {
  newSettlementMovementRef,
  resolveSettlementMovementConcept,
  settlementWalletRef,
} from "@/features/settlements/repositories/settlement-movement.helpers";
import { toGroupSettlementData } from "./group-settlements.data";
import { mapGroupSettlementDocument } from "./group-settlements.mapper";
import {
  assertGroupSettlementLinkShape,
  readGroupSettlementWallet,
} from "./group-settlement-link.helpers";
import { writeGroupSettlementNotification } from "./group-settlement-notification-write";
import { newGroupSettlementRef } from "./group-settlements.operations";
import type { GroupSettlementNotificationBuilder } from "./group-settlements.repository";

/**
 * Creates the group settlement, its optional creditor income and the wallet
 * balance in one transaction; the wallet is validated inside it, so an invalid
 * wallet writes nothing at all. The counterpart notification is written after
 * the commit and is best effort on purpose (see `writeGroupSettlementNotification`).
 */
export async function createGroupSettlementOperation(
  dto: CreateGroupSettlementDto,
  notification: GroupSettlementNotificationBuilder,
  port: ISettlementMovementPort = new FirebaseSettlementMovementPort(),
): Promise<GroupSettlement> {
  assertGroupSettlementLinkShape(dto.receiverWalletId, dto.receiverCategoryId);

  const now = dto.updatedAt;
  const settlementDocument = newGroupSettlementRef();
  const walletId = dto.receiverWalletId;
  const movementDocument =
    walletId === null ? null : newSettlementMovementRef();

  const settlement: GroupSettlement = {
    id: settlementDocument.id,
    ...dto,
    receiverTransactionId: movementDocument ? movementDocument.id : null,
  };
  const event = notification(settlement);

  await runTransaction(db, async (transaction) => {
    const walletSnapshot =
      walletId === null
        ? null
        : await transaction.get(settlementWalletRef(walletId));
    const balance =
      walletId === null || walletSnapshot === null
        ? 0
        : readGroupSettlementWallet(walletSnapshot, dto.toUserId, dto.currency);

    transaction.set(settlementDocument, toGroupSettlementData(settlement));
    addGroupActivity(transaction, {
      type: "settlement-created",
      groupId: dto.groupId,
      actorId: dto.createdBy,
      settlementId: settlement.id,
      fromUserId: settlement.fromUserId,
      toUserId: settlement.toUserId,
      amountCents: dto.amountCents,
      currency: dto.currency,
      description: dto.note,
      createdAt: now,
    });

    if (walletId !== null && movementDocument !== null) {
      transaction.set(
        movementDocument,
        port.buildCreateData({
          movementId: movementDocument.id,
          ownerId: dto.toUserId,
          walletId,
          groupSettlementId: settlement.id,
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
  });

  await writeGroupSettlementNotification(event);

  const created = mapGroupSettlementDocument(settlement.id, {
    ...toGroupSettlementData(settlement),
  });
  if (!created) throw new GroupExpenseOperationError("SETTLEMENT_NOT_FOUND");

  return created;
}
