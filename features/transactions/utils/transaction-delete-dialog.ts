import { Alert } from "react-native";

import { Wallet } from "@/features/wallets/types/wallet.types";
import { formatMoney } from "@/features/wallets/utils/money";

import { Transaction } from "../types/transaction.types";

export interface DeleteTransactionDialogOptions {
  transaction: Transaction;
  walletMap: ReadonlyMap<string, Wallet>;
  onConfirm: () => void;
}

/** Asks for confirmation before deleting a movement and reverting its balance. */
export function showDeleteTransactionDialog({
  transaction,
  walletMap,
  onConfirm,
}: DeleteTransactionDialogOptions): void {
  const walletName = walletMap.get(transaction.walletId)?.name ?? "esta cartera";
  const amount = formatMoney(transaction.amount, transaction.currency);

  Alert.alert(
    "Eliminar movimiento",
    `Se eliminará "${transaction.concept}" (${amount}) de ${walletName} y se revertirá el saldo.`,
    [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: onConfirm },
    ],
  );
}
