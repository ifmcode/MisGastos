import { Category } from "@/features/categories/types/category.types";
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
 * Builds the form values for a new movement or an existing one. A new movement
 * starts without a wallet: the preferred currency is only provisional and the
 * selected wallet currency replaces it once the user picks one.
 */
export function buildTransactionFormValues(
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

  return {
    type: DEFAULT_TYPE,
    amount: "",
    walletId: "",
    currency: preferredCurrency,
    categoryId: getDefaultCategoryId(categories, DEFAULT_TYPE),
    concept: "",
    notes: "",
    date: getDefaultMovementIsoDate(),
  };
}
