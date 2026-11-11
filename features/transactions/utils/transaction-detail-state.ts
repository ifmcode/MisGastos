import { Transaction } from "../types/transaction.types";

export interface TransactionDetailState {
  selectedId: string | null;
}

export type TransactionDetailAction =
  | { type: "open"; transactionId: string }
  | { type: "close" };

export const INITIAL_TRANSACTION_DETAIL_STATE: TransactionDetailState = {
  selectedId: null,
};

/** Owns which movement is shown in the read-only detail view. */
export function transactionDetailReducer(
  state: TransactionDetailState,
  action: TransactionDetailAction,
): TransactionDetailState {
  switch (action.type) {
    case "open":
      return { selectedId: action.transactionId };
    case "close":
      return INITIAL_TRANSACTION_DETAIL_STATE;
    default:
      return state;
  }
}

/** Resolves the selected movement from the live collection, or null if it is gone. */
export function findTransactionForDetail(
  transactions: readonly Transaction[],
  selectedId: string | null,
): Transaction | null {
  if (!selectedId) return null;

  return (
    transactions.find((transaction) => transaction.id === selectedId) ?? null
  );
}
