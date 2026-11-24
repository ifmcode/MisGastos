import {
  movementRef,
  newMovementRef,
} from "@/features/shared-expenses/repositories/shared-expense-movement-ref";
import { nextRevision } from "@/shared/utils/revision";

import type {
  GroupExpense,
  UpdateGroupExpenseDto,
} from "../types/group-expense.types";
import type { MovementSyncContext } from "./group-expense-link-movement";

/**
 * Writes the single linked movement of a group expense: an existing document is
 * updated (reviving it with `deletedAt: null`), a new one is created. The
 * creation stamp of an existing movement is preserved.
 */
export function writeGroupMovement(
  transaction: {
    update(reference: unknown, data: Record<string, unknown>): void;
    set(reference: unknown, data: Record<string, unknown>): void;
  },
  stored: GroupExpense,
  update: UpdateGroupExpenseDto,
  context: MovementSyncContext,
): string {
  const { viewerUid, previous, port, now } = context;
  const targetRef = previous ? movementRef(previous.id) : newMovementRef();
  const input = {
    movementId: targetRef.id,
    ownerId: viewerUid,
    walletId: update.walletId ?? "",
    groupExpenseId: stored.id,
    amountCents: update.amountCents,
    currency: update.currency,
    categoryId: update.categoryId ?? "",
    concept: update.description,
    date: update.date,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };

  if (previous) {
    transaction.update(targetRef, {
      ...port.buildUpdateData(input),
      createdAt: previous.createdAt ?? now,
      deletedAt: null,
      revision: nextRevision(previous),
    });
  } else {
    transaction.set(targetRef, port.buildCreateData(input));
  }

  return targetRef.id;
}
