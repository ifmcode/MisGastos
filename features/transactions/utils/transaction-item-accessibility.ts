import { Transaction } from "../types/transaction.types";

export interface TransactionDetailLabel {
  key: string;
  values: {
    typeKey: string;
    concept: string;
    amount: string;
    date: string;
    category: string;
    wallet?: string;
  };
}

/** Screen-reader summary and open action for a movement card. */
export function getTransactionDetailLabel(
  transaction: Transaction,
  categoryLabel: string,
  amount: string,
  date: string,
  walletName?: string,
): TransactionDetailLabel {
  return {
    key: walletName
      ? "accessibility.detailLabelWithWallet"
      : "accessibility.detailLabel",
    values: {
      typeKey:
        transaction.type === "income" ? "types.income" : "types.expense",
      concept: transaction.concept,
      amount,
      date,
      category: categoryLabel,
      ...(walletName ? { wallet: walletName } : {}),
    },
  };
}

export const OPEN_TRANSACTION_DETAIL_HINT_KEY = "accessibility.openDetailHint";
