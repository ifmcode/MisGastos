import { nextRevision } from "@/shared/utils/revision";

import type {
  SharedExpense,
  UpdateSharedExpenseDto,
} from "../types/shared-expense.types";
import type { MovementSyncContext } from "./shared-expense-link-movement";
import { movementRef, newMovementRef } from "./shared-expense-movement-ref";

/**
 * Writes the single linked movement: an existing document is updated (reviving
 * it with `deletedAt: null`), a new one is created. The creation stamp of an
 * existing movement is preserved.
 */
export function writeMovement(
  transaction: {
    update(reference: unknown, data: Record<string, unknown>): void;
    set(reference: unknown, data: Record<string, unknown>): void;
  },
  stored: SharedExpense,
  update: UpdateSharedExpenseDto,
  context: MovementSyncContext,
): string {
  const { viewerUid, previous, port, now } = context;
  const targetRef = previous ? movementRef(previous.id) : newMovementRef();
  const input = {
    movementId: targetRef.id,
    ownerId: viewerUid,
    walletId: update.walletId ?? "",
    sharedExpenseId: stored.id,
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
