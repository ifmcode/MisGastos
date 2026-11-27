import { doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { nextRevision, readStoredRevision } from "@/shared/utils/revision";
import {
  assertExpectedRevision,
  readAppliedRevision,
  writeAppliedMutation,
  type SocialMutationContext,
} from "@/shared/services/sync/firestore-idempotency";
import { SyncMutationError } from "@/shared/services/sync/sync.errors";
import { FirebaseLinkedMovementPort } from "@/features/shared-expenses/repositories/firebase-linked-movement.port";
import type { ILinkedMovementPort } from "@/features/shared-expenses/repositories/linked-movement.port";
import { movementRef } from "@/features/shared-expenses/repositories/shared-expense-movement-ref";
import { addGroupActivity } from "@/features/groups/repositories/group-activity.writes";

import { GroupExpenseOperationError } from "../services/group-expense.errors";
import { readGroupExpenseDocument } from "./group-expense-link.helpers";
import {
  readActiveMovement,
  readStoredMovement,
  revertMovementWallet,
} from "./group-expense-link-movement";
import { GROUP_EXPENSES_COLLECTION } from "./group-expenses.operations";

export interface SoftDeleteGroupExpenseLinkOptions {
  viewerUid: string;
  expenseId: string;
  deletedAt: string;
  /** Present only while draining the outbox. */
  sync?: SocialMutationContext;
}

/**
 * Soft delete is idempotent: an expense that is already deleted returns without
 * touching the balance, so a repeated request can never revert twice. The
 * movement is soft-deleted and the expense keeps its audit trail.
 */
export async function softDeleteGroupExpenseLinkOperation(
  { viewerUid, expenseId, deletedAt, sync }: SoftDeleteGroupExpenseLinkOptions,
  port: ILinkedMovementPort = new FirebaseLinkedMovementPort(),
): Promise<void> {
  const expenseRef = doc(db, GROUP_EXPENSES_COLLECTION, expenseId);

  await runTransaction(db, async (transaction) => {
    if (sync) {
      const replay = await readAppliedRevision(
        transaction,
        sync.ownerId,
        sync,
      );

      if (replay !== null) return;
    }

    const expenseSnapshot = await transaction.get(expenseRef);
    if (sync && !expenseSnapshot.exists()) {
      throw new SyncMutationError("DELETED_REMOTELY");
    }

    const stored = readGroupExpenseDocument(expenseId, expenseSnapshot);
    const revision = nextRevision(expenseSnapshot.data());

    if (stored.deletedAt !== null) {
      if (sync) {
        writeAppliedMutation(transaction, {
          ownerId: sync.ownerId,
          context: sync,
          entityType: "group-expense",
          entityId: expenseId,
          revisionAfter: readStoredRevision(stored),
          now: deletedAt,
        });
      }
      return;
    }

    if (sync) assertExpectedRevision(expenseSnapshot.data() ?? {}, sync);

    // The movement belongs to the payer. Checking the stored record first keeps
    // a non-payer from reading a movement the rules would deny, and returns the
    // same stable code the service and the edit path use.
    if (
      stored.payerId !== viewerUid &&
      (stored.linkedTransactionId !== null ||
        stored.walletId !== null ||
        stored.categoryId !== null)
    ) {
      throw new GroupExpenseOperationError("LINKED_MOVEMENT_FOREIGN");
    }

    const patch: Record<string, unknown> = {
      deletedAt,
      updatedAt: deletedAt,
      revision,
    };
    const previous = await readStoredMovement(transaction, stored, port);
    const active = readActiveMovement(previous);

    if (active) {
      // The movement belongs to the payer; another member cannot revert it.
      if (active.ownerId !== viewerUid) {
        throw new GroupExpenseOperationError("WALLET_NOT_OWNED");
      }

      await revertMovementWallet(
        transaction,
        active,
        viewerUid,
        stored.currency,
        deletedAt,
        port,
      );
      transaction.update(movementRef(active.id), {
        deletedAt,
        updatedAt: deletedAt,
        revision: nextRevision(active),
      });
    }

    // The whole link is cleared as a unit: a closed expense keeps no wallet, no
    // category and no movement reference, matching `isGroupExpenseLinked`.
    if (
      stored.walletId !== null ||
      stored.categoryId !== null ||
      stored.linkedTransactionId !== null
    ) {
      patch.walletId = null;
      patch.categoryId = null;
      patch.linkedTransactionId = null;
    }

    transaction.update(expenseRef, patch);
    addGroupActivity(transaction, {
      type: "expense-deleted",
      groupId: stored.groupId,
      actorId: viewerUid,
      expenseId,
      amountCents: stored.amountCents,
      currency: stored.currency,
      description: stored.description,
      createdAt: deletedAt,
    });

    if (sync) {
      writeAppliedMutation(transaction, {
        ownerId: sync.ownerId,
        context: sync,
        entityType: "group-expense",
        entityId: expenseId,
        revisionAfter: revision,
        now: deletedAt,
      });
    }
  });
}
