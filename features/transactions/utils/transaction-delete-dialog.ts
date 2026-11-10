import { Wallet } from "@/features/wallets/types/wallet.types";
import { isOrphanedWalletId } from "@/features/wallets/utils/deleted-wallet";
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
  const amount = formatMoney(transaction.amount, transaction.currency);

  if (isOrphanedWalletId(transaction.walletId)) {
    const historyLabel = transaction.walletName
      ? ` del historial de la cartera «${transaction.walletName}»`
      : " del historial";

    return {
      title: "Eliminar movimiento",
      message: `Se eliminará "${transaction.concept}" (${amount})${historyLabel}. La cartera ya no existe, así que no hay saldo que revertir.`,
    };
  }

  const walletName =
    wallets.find((wallet) => wallet.id === transaction.walletId)?.name ??
    transaction.walletName ??
    "esta cartera";

  return {
    title: "Eliminar movimiento",
    message: `Se eliminará "${transaction.concept}" (${amount}) de ${walletName} y se revertirá el saldo.`,
  };
}
