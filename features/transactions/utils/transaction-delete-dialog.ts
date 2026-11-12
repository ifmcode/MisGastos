import { Wallet } from "@/features/wallets/types/wallet.types";
import { isOrphanedWalletId } from "@/features/wallets/utils/deleted-wallet";

import { Transaction } from "../types/transaction.types";

export interface DeleteTransactionConfirmation {
  titleKey: string;
  messageKey: string;
  values: { concept: string; amount: string; wallet: string };
}

/**
 * Builds the translation keys shown before deleting a movement and reverting
 * its balance. The caller formats the amount with the active locale.
 */
export function getDeleteTransactionConfirmation(
  transaction: Transaction,
  wallets: readonly Wallet[],
  amount: string,
): DeleteTransactionConfirmation {
  if (isOrphanedWalletId(transaction.walletId)) {
    return {
      titleKey: "deleteDialog.title",
      messageKey: transaction.walletName
        ? "deleteDialog.messageOrphan"
        : "deleteDialog.messageOrphanNoWallet",
      values: {
        concept: transaction.concept,
        amount,
        wallet: transaction.walletName ?? "",
      },
    };
  }

  const walletName =
    wallets.find((wallet) => wallet.id === transaction.walletId)?.name ??
    transaction.walletName ??
    "";

  return {
    titleKey: "deleteDialog.title",
    messageKey: "deleteDialog.message",
    values: {
      concept: transaction.concept,
      amount,
      wallet: walletName,
    },
  };
}
