import { useState } from "react";

import { rememberLastUsedDate } from "@/shared/utils/last-used-date-store";

import { TransactionInput } from "../schemas/transaction.schema";
import { Transaction } from "../types/transaction.types";

export interface UseTransactionFormDialogOptions {
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
  deleteEditing: () => Promise<void>;
}

/** Owns the open/edit/delete lifecycle of the movement form modal. */
export function useTransactionFormDialog({
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

    rememberLastUsedDate(input.date);
    finish();
  }

  async function deleteEditing() {
    if (!editingTransaction) return;

    const deleted = await deleteTransaction(editingTransaction.id);
    if (!deleted) return;

    finish();
  }

  return {
    visible,
    editingTransaction,
    openCreate,
    openEdit,
    close,
    submit,
    deleteEditing,
  };
}
