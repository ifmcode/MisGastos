import { Alert } from "react-native";

import { Transfer } from "@/features/transfers/types/transfer.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { formatMoney } from "@/features/wallets/utils/money";

export interface DeleteTransferDialogOptions {
  transfer: Transfer;
  walletMap: ReadonlyMap<string, Wallet>;
  onConfirm: () => void;
}

/** Asks for confirmation before soft-deleting a transfer. */
export function showDeleteTransferDialog({
  transfer,
  walletMap,
  onConfirm,
}: DeleteTransferDialogOptions): void {
  const fromName = walletMap.get(transfer.fromWalletId)?.name ?? "la cartera";
  const toName = walletMap.get(transfer.toWalletId)?.name ?? "la cartera";
  const amount = formatMoney(transfer.amount, transfer.currency);

  Alert.alert(
    "Eliminar transferencia",
    `Se eliminará la transferencia de ${amount} de ${fromName} a ${toName}. Los saldos se revertirán y el registro se conservará para auditoría.`,
    [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: onConfirm },
    ],
  );
}
