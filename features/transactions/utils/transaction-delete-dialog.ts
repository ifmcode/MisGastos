import { Wallet } from "@/features/wallets/types/wallet.types";
import { formatMoney } from "@/features/wallets/utils/money";

import { Transaction } from "../types/transaction.types";

export interface DeleteTransactionConfirmation {
  title: string;
  message: string;
}

/** Builds the copy shown before deleting a movement and reverting its balance. */
export function getDeleteTransactionConfirmation(
  transaction: Transaction,
  wallets: readonly Wallet[],
): DeleteTransactionConfirmation {
  const walletName =
    wallets.find((wallet) => wallet.id === transaction.walletId)?.name ??
    "esta cartera";
  const amount = formatMoney(transaction.amount, transaction.currency);

  return {
    title: "Eliminar movimiento",
    message: `Se eliminará "${transaction.concept}" (${amount}) de ${walletName} y se revertirá el saldo.`,
  };
}
