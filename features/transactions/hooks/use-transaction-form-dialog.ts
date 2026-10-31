import { useState } from "react";

import { Wallet } from "@/features/wallets/types/wallet.types";

import {
  TransactionInput,
} from "../schemas/transaction.schema";
import { Transaction } from "../types/transaction.types";
import { showDeleteTransactionDialog } from "../utils/transaction-delete-dialog";

export interface UseTransactionFormDialogOptions {
  walletMap: ReadonlyMap<string, Wallet>;
  mutating: boolean;
  createTransaction: (input: TransactionInput) => Promise<boolean>;
  updateTransaction: (
    transactionId: string,
    input: TransactionInput,
  ) => Promise<boolean>;
  deleteTransaction: (transactionId: string) => Promise<boolean>;
  clearMutationState: () => void;
}

export interface TransactionFormDialog {
  visible: boolean;
  editingTransaction: Transaction | null;
  openCreate: () => void;
  openEdit: (transaction: Transaction) => void;
  close: () => void;
  submit: (input: TransactionInput) => Promise<void>;
  requestDelete: () => void;
}

/** Owns the open/edit/delete lifecycle of the movement form modal. */
export function useTransactionFormDialog({
  walletMap,
  mutating,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  clearMutationState,
}: UseTransactionFormDialogOptions): TransactionFormDialog {
  const [visible, setVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  function finish() {
    setVisible(false);
    setEditingTransaction(null);
  }

  function openCreate() {
    clearMutationState();
    setEditingTransaction(null);
    setVisible(true);
  }

  function openEdit(transaction: Transaction) {
    clearMutationState();
    setEditingTransaction(transaction);
    setVisible(true);
  }

  function close() {
    if (mutating) return;
    finish();
  }

  async function submit(input: TransactionInput) {
    const saved = editingTransaction
      ? await updateTransaction(editingTransaction.id, input)
      : await createTransaction(input);

    if (!saved) return;

    finish();
  }

  function requestDelete() {
    if (!editingTransaction) return;

    showDeleteTransactionDialog({
      transaction: editingTransaction,
      walletMap,
      onConfirm: async () => {
        const deleted = await deleteTransaction(editingTransaction.id);
        if (!deleted) return;
        finish();
      },
    });
  }

  return {
    visible,
    editingTransaction,
    openCreate,
    openEdit,
    close,
    submit,
    requestDelete,
  };
}
