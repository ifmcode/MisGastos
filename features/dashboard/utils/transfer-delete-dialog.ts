import { Transfer } from "@/features/transfers/types/transfer.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { isOrphanedWalletId } from "@/features/wallets/utils/deleted-wallet";
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
  const fromOrphaned = isOrphanedWalletId(transfer.fromWalletId);
  const toOrphaned = isOrphanedWalletId(transfer.toWalletId);
  const fromName = fromOrphaned
    ? transfer.fromWalletName ?? "la cartera eliminada"
    : wallets.find((wallet) => wallet.id === transfer.fromWalletId)?.name ??
      transfer.fromWalletName ??
      "la cartera";
  const toName = toOrphaned
    ? transfer.toWalletName ?? "la cartera eliminada"
    : wallets.find((wallet) => wallet.id === transfer.toWalletId)?.name ??
      transfer.toWalletName ??
      "la cartera";
  const amount = formatMoney(transfer.amount, transfer.currency);

  const balanceMessage =
    fromOrphaned && toOrphaned
      ? "Ninguna de las dos carteras existe ya, así que no hay saldos que revertir."
      : fromOrphaned || toOrphaned
        ? "Solo se revertirá el saldo de la cartera que sigue existiendo."
        : "Los saldos se revertirán";

  return {
    title: "Eliminar transferencia",
    message: `Se eliminará la transferencia de ${amount} de ${fromName} a ${toName}. ${balanceMessage} y el registro se conservará para auditoría.`,
  };
}
