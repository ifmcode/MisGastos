import { Transfer } from "@/features/transfers/types/transfer.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { isOrphanedWalletId } from "@/features/wallets/utils/deleted-wallet";

export interface DeleteTransferConfirmation {
  titleKey: string;
  messageKey: string;
  values: {
    amount: string;
    from: string;
    to: string;
    balanceMessage: string;
  };
}

/**
 * Builds the translation keys shown before soft-deleting a transfer. The caller
 * formats the amount and resolves wallet names with the active locale.
 */
export function getDeleteTransferConfirmation(
  transfer: Transfer,
  wallets: readonly Wallet[],
  amount: string,
  fallbackWallet: string,
  fallbackDeletedWallet: string,
  balanceMessages: {
    bothOrphaned: string;
    oneOrphaned: string;
    noneOrphaned: string;
  },
): DeleteTransferConfirmation {
  const fromOrphaned = isOrphanedWalletId(transfer.fromWalletId);
  const toOrphaned = isOrphanedWalletId(transfer.toWalletId);
  const fromName = fromOrphaned
    ? transfer.fromWalletName ?? fallbackDeletedWallet
    : wallets.find((wallet) => wallet.id === transfer.fromWalletId)?.name ??
      transfer.fromWalletName ??
      fallbackWallet;
  const toName = toOrphaned
    ? transfer.toWalletName ?? fallbackDeletedWallet
    : wallets.find((wallet) => wallet.id === transfer.toWalletId)?.name ??
      transfer.toWalletName ??
      fallbackWallet;

  const balanceMessage =
    fromOrphaned && toOrphaned
      ? balanceMessages.bothOrphaned
      : fromOrphaned || toOrphaned
        ? balanceMessages.oneOrphaned
        : balanceMessages.noneOrphaned;

  return {
    titleKey: "deleteDialog.title",
    messageKey: "deleteDialog.message",
    values: { amount, from: fromName, to: toName, balanceMessage },
  };
}
