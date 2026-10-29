import { roundMoney } from "@/features/wallets/utils/money";

import { TransactionType } from "../types/transaction.types";

export interface TransactionMovement {
  type: TransactionType;
  amount: number;
}

/**
 * Income increases the wallet balance; expenses decrease it. The amount is
 * always positive because it is validated before reaching this helper.
 */
export function getSignedTransactionAmount({
  type,
  amount,
}: TransactionMovement): number {
  return roundMoney(type === "income" ? amount : -amount);
}

export function applyTransactionToBalance(
  balance: number,
  movement: TransactionMovement,
): number {
  return roundMoney(balance + getSignedTransactionAmount(movement));
}

export function revertTransactionFromBalance(
  balance: number,
  movement: TransactionMovement,
): number {
  return roundMoney(balance - getSignedTransactionAmount(movement));
}

/**
 * Applies an edit to a wallet balance by reverting the previous movement and
 * applying the new one. Used when both movements belong to the same wallet.
 */
export function applyTransactionUpdateToBalance(
  balance: number,
  previous: TransactionMovement,
  next: TransactionMovement,
): number {
  return roundMoney(
    balance -
      getSignedTransactionAmount(previous) +
      getSignedTransactionAmount(next),
  );
}
