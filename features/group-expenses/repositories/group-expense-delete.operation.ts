import { doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { nextRevision, readStoredRevision } from "@/shared/utils/revision";
import { addGroupActivity } from "@/features/groups/repositories/group-activity.writes";
import {
  assertExpectedRevision,
  readAppliedRevision,
  writeAppliedMutation,
  type SocialMutationContext,
} from "@/shared/services/sync/firestore-idempotency";
import { SyncMutationError } from "@/shared/services/sync/sync.errors";

import { GroupExpenseOperationError } from "../services/group-expense.errors";
import { mapGroupExpenseDocument } from "./group-expenses.mapper";
import { GROUP_EXPENSES_COLLECTION } from "./group-expenses.operations";

export interface SoftDeleteGroupExpenseOperationOptions {
  /** Present only while draining the outbox. */
  sync?: SocialMutationContext;
}

/**
 * Soft delete: only `deletedAt` and `updatedAt` change, which is the exact
 * `diff` the rules allow, and the record keeps its audit trail. Idempotent: an
 * already deleted expense returns without writing a second history event.
 */
export async function softDeleteGroupExpenseOperation(
  expenseId: string,
  deletedAt: string,
  viewerUid: string,
  options: SoftDeleteGroupExpenseOperationOptions = {},
): Promise<void> {
  const expenseRef = doc(db, GROUP_EXPENSES_COLLECTION, expenseId);
  const sync = options.sync;

  await runTransaction(db, async (transaction) => {
    if (sync) {
      const replay = await readAppliedRevision(
        transaction,
        sync.ownerId,
        sync,
      );

      if (replay !== null) return;
    }

    const snapshot = await transaction.get(expenseRef);
    if (!snapshot.exists()) {
      throw sync
        ? new SyncMutationError("DELETED_REMOTELY")
        : new GroupExpenseOperationError("EXPENSE_NOT_FOUND");
    }

    const data = snapshot.data() as Record<string, unknown>;
    const stored = mapGroupExpenseDocument(expenseId, data);
    if (!stored) throw new GroupExpenseOperationError("EXPENSE_NOT_FOUND");

    const revision = nextRevision(data);

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

    if (sync) assertExpectedRevision(data, sync);

    transaction.update(expenseRef, { deletedAt, updatedAt: deletedAt, revision });
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
