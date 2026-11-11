import { useMemo, useReducer } from "react";

import { Transaction } from "../types/transaction.types";
import {
  findTransactionForDetail,
  INITIAL_TRANSACTION_DETAIL_STATE,
  transactionDetailReducer,
} from "../utils/transaction-detail-state";

export interface TransactionDetailDialog {
  visible: boolean;
  transaction: Transaction | null;
  open: (transaction: Transaction) => void;
  close: () => void;
}

/** Owns the open/close lifecycle of the read-only movement detail view. */
export function useTransactionDetailDialog(
  transactions: readonly Transaction[],
): TransactionDetailDialog {
  const [state, dispatch] = useReducer(
    transactionDetailReducer,
    INITIAL_TRANSACTION_DETAIL_STATE,
  );
  const transaction = useMemo(
    () => findTransactionForDetail(transactions, state.selectedId),
    [transactions, state.selectedId],
  );

  return {
    visible: state.selectedId !== null,
    transaction,
    open: (selected) =>
      dispatch({ type: "open", transactionId: selected.id }),
    close: () => dispatch({ type: "close" }),
  };
}
