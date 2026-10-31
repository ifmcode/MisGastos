import { Wallet } from "@/features/wallets/types/wallet.types";

import {
  Transaction,
  TransactionFormValues,
} from "../types/transaction.types";import {
  getCategoriesForType,
  getDefaultCategoryId,
} from "../utils/transaction-options";

const DEFAULT_TYPE = "expense";

/** Builds the form values for a new movement or an existing one. */
export function buildTransactionFormValues(
  wallets: readonly Wallet[],
  editingTransaction: Transaction | null,
): TransactionFormValues {
  if (editingTransaction) {
    return {
      type: editingTransaction.type,
      amount: String(editingTransaction.amount),
      walletId: editingTransaction.walletId,
      currency: editingTransaction.currency,
      categoryId: editingTransaction.categoryId,
      concept: editingTransaction.concept,
      notes: editingTransaction.notes ?? "",
      date: editingTransaction.date,
    };
  }

  return {
    type: DEFAULT_TYPE,
    amount: "",
    walletId: wallets[0]?.id ?? "",
    currency: wallets[0]?.currency ?? "EUR",
    categoryId:
      getCategoriesForType(DEFAULT_TYPE)[0]?.id ??
      getDefaultCategoryId(DEFAULT_TYPE),
    concept: "",
    notes: "",
    date: "",
  };
}
