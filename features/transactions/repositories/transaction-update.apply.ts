import { roundMoney } from "@/shared/utils/money";

import type { Wallet } from "@/features/wallets/types/wallet.types";
import { TransactionOperationError } from "../services/transaction.errors";
import type { UpdateTransactionDto } from "../types/transaction.types";
import { applyTransactionWalletAdjustment } from "./transaction-update.wallets";

type StoredMovement = {
  type: "expense" | "income";
  amount: number;
  walletId: string;
};

function readStoredMovement(
  stored: Record<string, unknown>,
): StoredMovement {
  const type = stored.type;
  const amount =
    typeof stored.amount === "number" ? roundMoney(stored.amount) : null;
  const walletId =
    typeof stored.walletId === "string" ? stored.walletId : "";

  if (type !== "expense" && type !== "income") {
    throw new TransactionOperationError("TRANSACTION_INVALID");
  }
  if (amount === null || amount <= 0) {
    throw new TransactionOperationError("TRANSACTION_INVALID");
  }
  if (walletId.length === 0) {
    throw new TransactionOperationError("TRANSACTION_INVALID");
  }

  return { type, amount, walletId };
}

/** Reverts the stored movement from its wallet before the new payload lands. */
export async function applyTransactionUpdate(
  transaction: Parameters<typeof applyTransactionWalletAdjustment>[0],
  ownerId: string,
  now: string,
  stored: Record<string, unknown>,
  dto: UpdateTransactionDto,
): Promise<Wallet[]> {
  const previous = readStoredMovement(stored);

  return applyTransactionWalletAdjustment(transaction, ownerId, now, previous, {
    type: dto.type,
    amount: dto.amount,
    walletId: dto.walletId,
    currency: dto.currency,
  });
}
