import { getTodayIsoDate } from "@/features/transactions/utils/transaction-date";
import {
  Transfer,
  TransferFormValues,
} from "@/features/transfers/types/transfer.types";
import { Wallet } from "@/features/wallets/types/wallet.types";

export interface DefaultTransferWallets {
  fromWallet: Wallet | null;
  toWallet: Wallet | null;
}

/**
 * Picks the wallets a new transfer should start with: the first wallet that
 * shares its currency with another one, plus a destination in that currency.
 */
export function getDefaultTransferWallets(
  wallets: readonly Wallet[],
): DefaultTransferWallets {
  const fromWallet =
    wallets.find((wallet) =>
      wallets.some(
        (other) =>
          other.id !== wallet.id && other.currency === wallet.currency,
      ),
    ) ??
    wallets[0] ??
    null;

  if (!fromWallet) return { fromWallet: null, toWallet: null };

  const toWallet =
    wallets.find(
      (wallet) =>
        wallet.id !== fromWallet.id && wallet.currency === fromWallet.currency,
    ) ?? null;

  return { fromWallet, toWallet };
}

/** Builds the initial values for the create/edit transfer form. */
export function buildTransferFormValues(
  wallets: readonly Wallet[],
  editingTransfer: Transfer | null,
): TransferFormValues {
  if (editingTransfer) {
    return {
      fromWalletId: editingTransfer.fromWalletId,
      toWalletId: editingTransfer.toWalletId,
      amount: String(editingTransfer.amount),
      currency: editingTransfer.currency,
      date: editingTransfer.date,
      notes: editingTransfer.notes ?? "",
    };
  }

  const { fromWallet, toWallet } = getDefaultTransferWallets(wallets);

  return {
    fromWalletId: fromWallet?.id ?? "",
    toWalletId: toWallet?.id ?? "",
    amount: "",
    currency: fromWallet?.currency ?? "EUR",
    date: getTodayIsoDate(),
    notes: "",
  };
}
