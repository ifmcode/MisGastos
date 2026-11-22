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
import { findTransactionCategory } from "./transaction-options";

const DEFAULT_TYPE = "expense";

/**
 * Builds the form values for a new movement or an existing one. A new movement
 * starts without a wallet or category: the preferred currency is only
 * provisional, and the user always chooses both consciously.
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
    categoryId: "",
    concept: "",
    notes: "",
    date: getDefaultMovementIsoDate(),
  };
}
