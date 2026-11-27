import { runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { addGroupActivity } from "@/features/groups/repositories/group-activity.writes";
import {
  assertExpectedRevision,
  readAppliedRevision,
  writeAppliedMutation,
  type SocialMutationContext,
} from "@/shared/services/sync/firestore-idempotency";
import { SyncMutationError } from "@/shared/services/sync/sync.errors";
import { nextRevision } from "@/shared/utils/revision";
import { FirebaseSettlementMovementPort } from "@/features/settlements/repositories/firebase-settlement-movement.port";
import type { ISettlementMovementPort } from "@/features/settlements/repositories/settlement-movement.port";
import {
  readActiveSettlementMovement,
  readStoredSettlementMovement,
} from "@/features/settlements/repositories/settlement-movement.helpers";
import {
  softDeleteSettlementMovement,
  writeSettlementMovement,
} from "@/features/settlements/repositories/settlement-movement-write";
import {
  assertLinkChangeAllowed,
  resolveSettlementEdit,
} from "@/features/settlements/repositories/settlement-update.resolve";
import { applySettlementWalletEffects } from "@/features/settlements/repositories/settlement-wallet-effects";

import { GroupExpenseOperationError } from "../services/group-expense.errors";
import type { GroupSettlement } from "../types/group-settlement.types";
import {
  assertGroupSettlementLinkShape,
  groupSettlementError,
  readGroupSettlementDocument,
} from "./group-settlement-link.helpers";
import { writeGroupSettlementNotification } from "./group-settlement-notification-write";
import { toGroupSettlementUpdateData } from "./group-settlements.data";
import { mapGroupSettlementDocument } from "./group-settlements.mapper";
import { groupSettlementRef } from "./group-settlements.operations";
import type { UpdateGroupSettlementOperationOptions } from "./group-settlements.repository";

/**
 * Syncs every mutable field of a group settlement with its single income
 * movement. The previous wallet effect is reverted and the new one applied
 * inside the same transaction, so a repeated edit never double-counts. Only the
 * creditor may touch the receiver keys or resize a linked amount.
 */
export async function updateGroupSettlementOperation(
  {
    viewerUid,
    settlementId,
    update,
    notification,
    sync,
  }: UpdateGroupSettlementOperationOptions,
  port: ISettlementMovementPort = new FirebaseSettlementMovementPort(),
): Promise<GroupSettlement> {
  assertGroupSettlementLinkShape(update.receiverWalletId, update.receiverCategoryId);

  const now = update.updatedAt;
  const reference = groupSettlementRef(settlementId);
  let result: GroupSettlement | null = null;
  let applied = false;

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
          ? mapGroupSettlementDocument(
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

    const stored = readGroupSettlementDocument(settlementId, storedSnapshot);

    if (stored.deletedAt !== null) {
      throw sync
        ? new SyncMutationError("DELETED_REMOTELY")
        : new GroupExpenseOperationError("ALREADY_DELETED");
    }

    const viewerIsCreditor = stored.toUserId === viewerUid;
    assertLinkChangeAllowed(
      stored,
      update,
      viewerIsCreditor,
      groupSettlementError,
    );

    // The debtor never reads the creditor's movement: rules would deny it and
    // nothing may change on that side anyway.
    const previousStored = viewerIsCreditor
      ? await readStoredSettlementMovement(transaction, stored, port)
      : null;

    const edit = resolveSettlementEdit(
      stored,
      update,
      viewerIsCreditor,
      readActiveSettlementMovement(previousStored),
    );

    await applySettlementWalletEffects(
      transaction,
      edit,
      stored.toUserId,
      stored.currency,
      now,
      port,
      groupSettlementError,
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
            link: { groupSettlementId: stored.id },
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
      ...toGroupSettlementUpdateData({
        ...update,
        receiverWalletId: edit.destinationWalletId,
        receiverCategoryId: edit.destinationCategoryId,
        receiverTransactionId: linkedId,
      }),
      revision: nextRevision(storedSnapshot.data()),
    };

    transaction.update(reference, patch);
    addGroupActivity(transaction, {
      type: "settlement-updated",
      groupId: stored.groupId,
      actorId: viewerUid,
      settlementId,
      fromUserId: stored.fromUserId,
      toUserId: stored.toUserId,
      amountCents: update.amountCents,
      currency: stored.currency,
      description: update.note,
      createdAt: now,
    });
    result = mapGroupSettlementDocument(settlementId, { ...stored, ...patch });
    applied = true;

    if (sync) {
      writeAppliedMutation(transaction, {
        ownerId: sync.ownerId,
        context: sync,
        entityType: "group-settlement",
        entityId: settlementId,
        revisionAfter: patch.revision,
        now,
      });
    }
  });

  if (!result) throw new GroupExpenseOperationError("SETTLEMENT_NOT_FOUND");

  if (applied) await writeGroupSettlementNotification(notification);

  return result;
}
