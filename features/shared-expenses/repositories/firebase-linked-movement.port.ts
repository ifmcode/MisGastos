import { toTransactionData } from "@/features/transactions/repositories/transaction-firestore.utils";
import type { CreateTransactionDto } from "@/features/transactions/types/transaction.types";
import {
  applyTransactionToBalance,
  revertTransactionFromBalance,
} from "@/features/transactions/utils/transaction-balance";
import { roundMoney } from "@/features/wallets/utils/money";

import { centsToAmount } from "../utils/expense-amount";
import type {
  ILinkedMovementPort,
  LinkedMovementSnapshot,
  LinkedMovementState,
  LinkedMovementWriteInput,
} from "./linked-movement.port";

const LINKED_MOVEMENT_TYPE = "expense";

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toTransactionDto(
  input: LinkedMovementWriteInput,
): CreateTransactionDto {
  return {
    type: LINKED_MOVEMENT_TYPE,
    amount: centsToAmount(input.amountCents),
    currency: input.currency,
    walletId: input.walletId,
    categoryId: input.categoryId,
    concept: input.concept,
    date: input.date,
    // A movement carries one link at most: the present one wins.
    ...(input.sharedExpenseId
      ? { sharedExpenseId: input.sharedExpenseId }
      : {}),
    ...(input.groupExpenseId ? { groupExpenseId: input.groupExpenseId } : {}),
  };
}

/** Reuses the transaction mapper so both paths persist an identical shape. */
export class FirebaseLinkedMovementPort implements ILinkedMovementPort {
  buildCreateData(input: LinkedMovementWriteInput): Record<string, unknown> {
    return toTransactionData(
      input.ownerId,
      toTransactionDto(input),
      input.updatedAt,
    );
  }

  buildUpdateData(input: LinkedMovementWriteInput): Record<string, unknown> {
    const data = this.buildCreateData(input);
    // Creation stamp and owner are immutable; an update never rewrites them.
    delete data.createdAt;
    delete data.ownerId;

    return data;
  }

  readMovement(
    movementId: string,
    snapshot: LinkedMovementSnapshot,
  ): LinkedMovementState | null {
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
    };
  }

  toAmount(amountCents: number): number {
    return centsToAmount(amountCents);
  }

  applyAmountToBalance(balance: number, amountCents: number): number {
    return applyTransactionToBalance(balance, {
      type: LINKED_MOVEMENT_TYPE,
      amount: this.toAmount(amountCents),
    });
  }

  revertAmountFromBalance(balance: number, amountCents: number): number {
    return revertTransactionFromBalance(balance, {
      type: LINKED_MOVEMENT_TYPE,
      amount: this.toAmount(amountCents),
    });
  }
}
