import { roundMoney } from "@/shared/utils/money";

import { TransactionOperationError } from "../services/transaction.errors";

export type DeletableMovement = {
  type: "expense" | "income";
  amount: number;
  walletId: string;
  currency: string | null;
};

/** Stored fields a soft delete needs, validated like the update path. */
export function readDeletableMovement(
  stored: Record<string, unknown>,
): DeletableMovement {
  const type = stored.type;
  const amount =
    typeof stored.amount === "number" ? roundMoney(stored.amount) : null;
  const walletId =
    typeof stored.walletId === "string" ? stored.walletId : "";
  const currency =
    typeof stored.currency === "string" ? stored.currency : null;

  if (type !== "expense" && type !== "income") {
    throw new TransactionOperationError("TRANSACTION_INVALID");
  }
  if (amount === null || amount <= 0) {
    throw new TransactionOperationError("TRANSACTION_INVALID");
  }
  if (walletId.length === 0) {
    throw new TransactionOperationError("TRANSACTION_INVALID");
  }

  return { type, amount, walletId, currency };
}
