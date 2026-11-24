import { doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { addGroupActivity } from "@/features/groups/repositories/group-activity.writes";

import { GroupExpenseOperationError } from "../services/group-expense.errors";
import { mapGroupExpenseDocument } from "./group-expenses.mapper";
import { GROUP_EXPENSES_COLLECTION } from "./group-expenses.operations";

/**
 * Soft delete: only `deletedAt` and `updatedAt` change, which is the exact
 * `diff` the rules allow, and the record keeps its audit trail. Idempotent: an
 * already deleted expense returns without writing a second history event.
 */
export async function softDeleteGroupExpenseOperation(
  expenseId: string,
  deletedAt: string,
  viewerUid: string,
): Promise<void> {
  const expenseRef = doc(db, GROUP_EXPENSES_COLLECTION, expenseId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(expenseRef);
    if (!snapshot.exists()) {
      throw new GroupExpenseOperationError("EXPENSE_NOT_FOUND");
    }

    const stored = mapGroupExpenseDocument(
      snapshot.id,
      snapshot.data() as Record<string, unknown>,
    );
    if (!stored) throw new GroupExpenseOperationError("EXPENSE_NOT_FOUND");
    if (stored.deletedAt !== null) return;

    transaction.update(expenseRef, { deletedAt, updatedAt: deletedAt });
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
  });
}
