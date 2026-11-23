import { doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { FirebaseLinkedMovementPort } from "@/features/shared-expenses/repositories/firebase-linked-movement.port";
import type { ILinkedMovementPort } from "@/features/shared-expenses/repositories/linked-movement.port";
import { movementRef } from "@/features/shared-expenses/repositories/shared-expense-movement-ref";

import { GroupExpenseOperationError } from "../services/group-expense.errors";
import type {
  GroupExpense,
  UpdateGroupExpenseDto,
} from "../types/group-expense.types";
import { readGroupExpenseDocument } from "./group-expense-link.helpers";
import {
  readActiveMovement,
  readStoredMovement,
  revertMovementWallet,
  syncMovementWallet,
} from "./group-expense-link-movement";
import { toGroupExpenseUpdateData } from "./group-expenses.data";
import { mapGroupExpenseDocument } from "./group-expenses.mapper";
import { GROUP_EXPENSES_COLLECTION } from "./group-expenses.operations";

export interface UpdateGroupExpenseLinkOptions {
  viewerUid: string;
  expenseId: string;
  update: UpdateGroupExpenseDto;
}

/**
 * Syncs every mutable field of the group expense with its single linked
 * movement. The wallet effect is reverted and re-applied inside the same
 * transaction, so a repeated edit with no effective change never double-counts
 * the balance. Clearing the link (toggle off, another payer or a currency with
 * no compatible wallet) reverts once and soft-deletes the movement instead of
 * rejecting the save.
 */
export async function updateGroupExpenseLinkOperation(
  { viewerUid, expenseId, update }: UpdateGroupExpenseLinkOptions,
  port: ILinkedMovementPort = new FirebaseLinkedMovementPort(),
): Promise<GroupExpense> {
  const now = update.updatedAt;
  const expenseRef = doc(db, GROUP_EXPENSES_COLLECTION, expenseId);
  let result: GroupExpense | null = null;

  await runTransaction(db, async (transaction) => {
    const expenseSnapshot = await transaction.get(expenseRef);
    const stored = readGroupExpenseDocument(expenseId, expenseSnapshot);

    // The movement belongs to the payer; another member cannot revert it, so
    // the write is rejected instead of silently losing money from that wallet.
    if (
      stored.payerId !== viewerUid &&
      (stored.linkedTransactionId !== null || stored.walletId !== null)
    ) {
      throw new GroupExpenseOperationError("LINKED_MOVEMENT_FOREIGN");
    }

    // The other member's movement is owner-only. When the viewer takes over a
    // social expense paid by someone else, a new movement is created instead of
    // reading a movement that does not exist.
    const previous =
      stored.payerId === viewerUid
        ? await readStoredMovement(transaction, stored, port)
        : null;
    const active = readActiveMovement(previous);

    if (active && active.ownerId !== viewerUid) {
      throw new GroupExpenseOperationError("WALLET_NOT_OWNED");
    }

    const clearLink = update.walletId === null;
    let linkedId: string | null = null;

    if (clearLink) {
      // Toggle off, another payer or a currency change without a compatible
      // wallet: the personal movement cannot survive, so it is reverted and
      // soft-deleted while the expense keeps its social (group) record.
      if (active) {
        await revertMovementWallet(
          transaction,
          active,
          viewerUid,
          stored.currency,
          now,
          port,
        );
        transaction.update(movementRef(active.id), {
          deletedAt: now,
          updatedAt: now,
        });
      }
    } else {
      linkedId = await syncMovementWallet(transaction, stored, update, {
        viewerUid,
        previous,
        port,
        now,
      });
    }

    const patch = {
      ...toGroupExpenseUpdateData(update),
      linkedTransactionId: linkedId,
    };

    transaction.update(expenseRef, patch);
    // Map the post-write document shape, never the domain object: the mapper
    // only understands stored keys.
    result = mapGroupExpenseDocument(expenseId, {
      ...(expenseSnapshot.data() ?? {}),
      ...patch,
    });
  });

  if (!result) throw new GroupExpenseOperationError("EXPENSE_NOT_FOUND");

  return result;
}
