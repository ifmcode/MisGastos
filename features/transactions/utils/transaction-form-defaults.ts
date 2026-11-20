import { Category } from "@/features/categories/types/category.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { getActiveWallets } from "@/features/wallets/utils/wallet-status";
import {
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from "@/shared/constants/currencies";
import { getDefaultMovementIsoDate } from "@/shared/utils/date-defaults";

import {
  Transaction,
  TransactionFormValues,
} from "../types/transaction.types";
import {
  findTransactionCategory,
  getDefaultCategoryId,
} from "./transaction-options";

const DEFAULT_TYPE = "expense";

/**
 * Initial wallet of a new movement: the first active wallet in the profile
 * preferred currency, otherwise the existing first-wallet choice.
 */
function getDefaultWallet(
  wallets: readonly Wallet[],
  preferredCurrency: CurrencyCode,
): Wallet | null {
  const activeWallets = getActiveWallets(wallets);
  const preferredWallet = activeWallets.find(
    (wallet) => wallet.currency === preferredCurrency,
  );

  return preferredWallet ?? activeWallets[0] ?? wallets[0] ?? null;
}

/** Builds the form values for a new movement or an existing one. */
export function buildTransactionFormValues(
  wallets: readonly Wallet[],
  editingTransaction: Transaction | null,
  categories: readonly Category[],
  preferredCurrency: CurrencyCode = DEFAULT_CURRENCY,
): TransactionFormValues {
  if (editingTransaction) {
    return {
      type: editingTransaction.type,
      amount: String(editingTransaction.amount),
      walletId: editingTransaction.walletId,
      currency: editingTransaction.currency,
      categoryId:
        findTransactionCategory(categories, editingTransaction.categoryId)
          ?.id ?? editingTransaction.categoryId,
      concept: editingTransaction.concept,
      notes: editingTransaction.notes ?? "",
      date: editingTransaction.date,
    };
  }

  const wallet = getDefaultWallet(wallets, preferredCurrency);

  return {
    type: DEFAULT_TYPE,
    amount: "",
    walletId: wallet?.id ?? "",
    currency: wallet?.currency ?? DEFAULT_CURRENCY,
    categoryId: getDefaultCategoryId(categories, DEFAULT_TYPE),
    concept: "",
    notes: "",
    date: getDefaultMovementIsoDate(),
  };
}
