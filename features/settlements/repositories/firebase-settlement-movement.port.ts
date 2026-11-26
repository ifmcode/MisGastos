import { toTransactionData } from "@/features/transactions/repositories/transaction-firestore.utils";
import type { CreateTransactionDto } from "@/features/transactions/types/transaction.types";
import {
  applyTransactionToBalance,
  revertTransactionFromBalance,
} from "@/shared/utils/transaction-balance";
import { centsToAmount } from "@/features/shared-expenses/utils/expense-amount";
import { roundMoney } from "@/shared/utils/money";
import { INITIAL_REVISION, readStoredRevision } from "@/shared/utils/revision";

import type {
  ISettlementMovementPort,
  SettlementMovementSnapshot,
  SettlementMovementState,
  SettlementMovementWriteInput,
} from "./settlement-movement.port";

/** A settlement is recorded as an ordinary personal income of the creditor. */
const SETTLEMENT_MOVEMENT_TYPE = "income";

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toTransactionDto(
  input: SettlementMovementWriteInput,
): CreateTransactionDto {
  return {
    type: SETTLEMENT_MOVEMENT_TYPE,
    amount: centsToAmount(input.amountCents),
    currency: input.currency,
    walletId: input.walletId,
    categoryId: input.categoryId,
    concept: input.concept,
    date: input.date,
    // A movement carries one settlement link at most: the present one wins.
    ...(input.settlementId ? { settlementId: input.settlementId } : {}),
    ...(input.groupSettlementId
      ? { groupSettlementId: input.groupSettlementId }
      : {}),
  };
}

/** Reuses the transaction mapper so the movement keeps the canonical shape. */
export class FirebaseSettlementMovementPort implements ISettlementMovementPort {
  buildCreateData(
    input: SettlementMovementWriteInput,
  ): Record<string, unknown> {
    return toTransactionData(
      input.ownerId,
      toTransactionDto(input),
      input.updatedAt,
      INITIAL_REVISION,
    );
  }

  buildUpdateData(
    input: SettlementMovementWriteInput,
  ): Record<string, unknown> {
    const data = this.buildCreateData(input);
    // Creation stamp, owner and revision are set by the write helper: an update
    // must write the stored revision plus one, never the initial one.
    delete data.createdAt;
    delete data.ownerId;
    delete data.revision;

    return data;
  }

  readMovement(
    movementId: string,
    snapshot: SettlementMovementSnapshot,
  ): SettlementMovementState | null {
    if (!snapshot.exists || !snapshot.data) return null;

    const data = snapshot.data;
    const walletId = readText(data.walletId);
    const amount =
      typeof data.amount === "number" && Number.isFinite(data.amount)
        ? roundMoney(data.amount)
        : null;

    if (walletId.length === 0 || amount === null || amount <= 0) return null;

    const deletedAt = readText(data.deletedAt);
    const createdAt = readText(data.createdAt);

    return {
      id: movementId,
      ownerId: readText(data.ownerId),
      walletId,
      amountCents: Math.round(amount * 100),
      currency: readText(data.currency),
      deletedAt: deletedAt.length > 0 ? deletedAt : null,
      createdAt: createdAt.length > 0 ? createdAt : null,
      revision: readStoredRevision(data),
    };
  }

  toAmount(amountCents: number): number {
    return centsToAmount(amountCents);
  }

  applyAmountToBalance(balance: number, amountCents: number): number {
    return applyTransactionToBalance(balance, {
      type: SETTLEMENT_MOVEMENT_TYPE,
      amount: this.toAmount(amountCents),
    });
  }

  revertAmountFromBalance(balance: number, amountCents: number): number {
    return revertTransactionFromBalance(balance, {
      type: SETTLEMENT_MOVEMENT_TYPE,
      amount: this.toAmount(amountCents),
    });
  }
}
