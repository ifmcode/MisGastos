import { doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { nextRevision } from "@/shared/utils/revision";

import { SharedExpenseOperationError } from "../services/shared-expense.errors";
import { FirebaseLinkedMovementPort } from "./firebase-linked-movement.port";
import type { ILinkedMovementPort } from "./linked-movement.port";
import { readExpenseDocument } from "./shared-expense-link.helpers";
import {
  movementRef,
  readActiveMovement,
  readStoredMovement,
  revertMovementWallet,
} from "./shared-expense-link-movement";
import { SHARED_EXPENSES_COLLECTION } from "./shared-expenses.operations";

export interface SoftDeleteSharedExpenseLinkOptions {
  viewerUid: string;
  expenseId: string;
  deletedAt: string;
}

/**
 * Soft delete is idempotent: an expense that is already deleted returns without
 * touching the balance, so a repeated request can never revert twice.
 */
export async function softDeleteSharedExpenseLinkOperation(
  { viewerUid, expenseId, deletedAt }: SoftDeleteSharedExpenseLinkOptions,
  port: ILinkedMovementPort = new FirebaseLinkedMovementPort(),
): Promise<void> {
  const expenseRef = doc(db, SHARED_EXPENSES_COLLECTION, expenseId);

  await runTransaction(db, async (transaction) => {
    const expenseSnapshot = await transaction.get(expenseRef);
    const stored = readExpenseDocument(expenseId, expenseSnapshot);

    if (stored.deletedAt !== null) return;

    const patch: Record<string, unknown> = {
      deletedAt,
      updatedAt: deletedAt,
    };
    const previous = await readStoredMovement(transaction, stored, port);
    const active = readActiveMovement(previous);

    if (active) {
      // The movement belongs to the payer; another participant cannot revert it.
      if (active.ownerId !== viewerUid) {
        throw new SharedExpenseOperationError("WALLET_NOT_OWNED");
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

    if (stored.linkedTransactionId) patch.linkedTransactionId = null;

    transaction.update(expenseRef, patch);
  });
}
