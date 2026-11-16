import { doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";

import { SharedExpenseOperationError } from "../services/shared-expense.errors";
import type {
  SharedExpense,
  UpdateSharedExpenseDto,
} from "../types/shared-expense.types";
import { FirebaseLinkedMovementPort } from "./firebase-linked-movement.port";
import type { ILinkedMovementPort } from "./linked-movement.port";
import { readExpenseDocument } from "./shared-expense-link.helpers";
import {
  movementRef,
  readActiveMovement,
  readStoredMovement,
  revertMovementWallet,
  syncMovementWallet,
} from "./shared-expense-link-movement";
import { mapSharedExpenseDocument } from "./shared-expenses.mapper";
import { toExpenseUpdateData } from "./shared-expenses.data";
import { SHARED_EXPENSES_COLLECTION } from "./shared-expenses.operations";

export interface UpdateSharedExpenseLinkOptions {
  viewerUid: string;
  expenseId: string;
  update: UpdateSharedExpenseDto;
}

/**
 * Syncs every mutable field of the expense with its single linked movement.
 * The wallet effect is reverted and re-applied inside the same transaction, so
 * a repeated edit with no effective change never double-counts the balance.
 */
export async function updateSharedExpenseLinkOperation(
  { viewerUid, expenseId, update }: UpdateSharedExpenseLinkOptions,
  port: ILinkedMovementPort = new FirebaseLinkedMovementPort(),
): Promise<SharedExpense> {
  const now = update.updatedAt;
  const expenseRef = doc(db, SHARED_EXPENSES_COLLECTION, expenseId);
  let result: SharedExpense | null = null;

  await runTransaction(db, async (transaction) => {
    const expenseSnapshot = await transaction.get(expenseRef);
    const stored = readExpenseDocument(expenseId, expenseSnapshot);

    // A movement the friend created is owner-only: the viewer cannot revert it.
    // Taking over as payer would charge a second wallet and leave the friend's
    // debit alive, so the change is rejected instead of silently losing money.
    if (stored.payerId !== viewerUid && stored.linkedTransactionId !== null) {
      throw new SharedExpenseOperationError(
        "LINKED_MOVEMENT_NOT_REVERTIBLE",
      );
    }

    // The other participant's movement is owner-only. When the viewer takes
    // over a social friend-paid expense, a new movement is created instead of
    // reading a movement that does not exist.
    const previous =
      stored.payerId === viewerUid
        ? await readStoredMovement(transaction, stored, port)
        : null;
    const active = readActiveMovement(previous);

    if (active && active.ownerId !== viewerUid) {
      throw new SharedExpenseOperationError("WALLET_NOT_OWNED");
    }

    const clearLink = update.walletId === null;
    let linkedId: string | null = null;

    if (clearLink) {
      // A linked movement cannot survive a currency change without a wallet in
      // the new currency; the expense is not saved in that case.
      if (active && stored.currency !== update.currency) {
        throw new SharedExpenseOperationError("CURRENCY_MISMATCH");
      }
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
      ...toExpenseUpdateData(update),
      linkedTransactionId: linkedId,
    };

    transaction.update(expenseRef, patch);
    result = mapSharedExpenseDocument(expenseId, { ...stored, ...patch });

    if (!result) throw new SharedExpenseOperationError("EXPENSE_NOT_FOUND");
  });

  if (!result) throw new SharedExpenseOperationError("EXPENSE_NOT_FOUND");

  return result;
}
