import { CurrencyCode } from "@/shared/constants/currencies";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { formatMoney, roundMoney } from "@/features/wallets/utils/money";
import {
  getTodayIsoDate,
} from "@/features/transactions/utils/transaction-date";

import { Transfer, TransferFormValues } from "../types/transfer.types";

/** Applies the default date before the form starts editing. */
export function getInitialTransferFormValues(
  initialValues: TransferFormValues,
): TransferFormValues {
  return {
    ...initialValues,
    date: initialValues.date || getTodayIsoDate(),
  };
}

/** Wallets that share the source wallet currency, excluding the source itself. */export function getAvailableDestinations(
  wallets: readonly Wallet[],
  fromWalletId: string,
): Wallet[] {
  const source = wallets.find((wallet) => wallet.id === fromWalletId);

  return wallets.filter(
    (wallet) =>
      wallet.id !== fromWalletId && wallet.currency === source?.currency,
  );
}

/**
 * Balance shown for the source wallet. When editing, the original transfer is
 * added back so the user can retype any amount without a false warning.
 */
export function getAvailableSourceBalance(
  fromWallet: Wallet | undefined,
  editingTransfer: Transfer | null | undefined,
): number {
  if (!fromWallet) return 0;

  let balance = fromWallet.balance;

  if (editingTransfer?.fromWalletId === fromWallet.id) {
    balance += editingTransfer.amount;
  }
  if (editingTransfer?.toWalletId === fromWallet.id) {
    balance -= editingTransfer.amount;
  }

  return roundMoney(balance);
}

/** Balance the source wallet would have after the typed amount. */
export function getProjectedSourceBalance(
  availableBalance: number,
  amountText: string,
): number {
  const amount = Number(amountText.replace(",", ".")) || 0;
  return roundMoney(availableBalance - amount);
}

export function getInsufficientBalanceMessage(
  availableBalance: number,
  currency: CurrencyCode,
): string {
  return `Saldo insuficiente. Disponible: ${formatMoney(
    availableBalance,
    currency,
  )}.`;
}
