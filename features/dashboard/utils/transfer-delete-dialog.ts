import { Transfer } from "@/features/transfers/types/transfer.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { formatMoney } from "@/features/wallets/utils/money";

export interface DeleteTransferConfirmation {
  title: string;
  message: string;
}

/** Builds the copy shown before soft-deleting a transfer. */
export function getDeleteTransferConfirmation(
  transfer: Transfer,
  wallets: readonly Wallet[],
): DeleteTransferConfirmation {
  const fromName =
    wallets.find((wallet) => wallet.id === transfer.fromWalletId)?.name ??
    "la cartera";
  const toName =
    wallets.find((wallet) => wallet.id === transfer.toWalletId)?.name ??
    "la cartera";
  const amount = formatMoney(transfer.amount, transfer.currency);

  return {
    title: "Eliminar transferencia",
    message: `Se eliminará la transferencia de ${amount} de ${fromName} a ${toName}. Los saldos se revertirán y el registro se conservará para auditoría.`,
  };
}
