import type { Settlement } from "../types/settlement.types";
import type {
  ISettlementMovementPort,
  SettlementMovementState,
} from "./settlement-movement.port";
import {
  newSettlementMovementRef,
  resolveSettlementMovementConcept,
  settlementMovementRef,
  type SettlementTransaction,
} from "./settlement-movement.helpers";

export interface SettlementMovementWriteContext {
  creditorId: string;
  port: ISettlementMovementPort;
  now: string;
}

export interface SettlementMovementContent {
  walletId: string;
  amountCents: number;
  categoryId: string;
  note: string;
  date: string;
}

/**
 * Writes the single income movement: an existing document is updated (reviving
 * it with `deletedAt: null`), a new one is created. The creation stamp of an
 * existing movement is preserved, and the concept falls back to the stable
 * machine token when the settlement has no note.
 */
export function writeSettlementMovement(
  transaction: SettlementTransaction,
  settlement: Settlement,
  content: SettlementMovementContent,
  previous: SettlementMovementState | null,
  context: SettlementMovementWriteContext,
): string {
  const { creditorId, port, now } = context;
  const targetRef = previous
    ? settlementMovementRef(previous.id)
    : newSettlementMovementRef();
  const data = {
    movementId: targetRef.id,
    ownerId: creditorId,
    walletId: content.walletId,
    settlementId: settlement.id,
    amountCents: content.amountCents,
    currency: settlement.currency,
    categoryId: content.categoryId,
    concept: resolveSettlementMovementConcept(content.note),
    date: content.date,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };

  if (previous) {
    transaction.update(targetRef, {
      ...port.buildUpdateData(data),
      createdAt: previous.createdAt ?? now,
      deletedAt: null,
    });
  } else {
    transaction.set(targetRef, port.buildCreateData(data));
  }

  return targetRef.id;
}

/** Soft-deletes the single income movement of the settlement, if any. */
export function softDeleteSettlementMovement(
  transaction: Pick<SettlementTransaction, "update">,
  movementId: string | null,
  now: string,
): void {
  if (!movementId) return;

  transaction.update(settlementMovementRef(movementId), {
    deletedAt: now,
    updatedAt: now,
  });
}
