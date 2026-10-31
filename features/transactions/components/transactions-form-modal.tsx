import { Modal } from "react-native";

import { Wallet } from "@/features/wallets/types/wallet.types";

import {
  TransactionInput,
  TransactionValidationErrors,
} from "../schemas/transaction.schema";
import { Transaction } from "../types/transaction.types";
import { buildTransactionFormValues } from "../utils/transaction-form-defaults";
import { TransactionForm } from "./transaction-form";

export interface TransactionsFormModalProps {
  visible: boolean;
  mutating: boolean;
  error: string | null;
  fieldErrors: TransactionValidationErrors;
  wallets: Wallet[];
  editingTransaction: Transaction | null;
  onSubmit: (input: TransactionInput) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function TransactionsFormModal({
  visible,
  mutating,
  error,
  fieldErrors,
  wallets,
  editingTransaction,
  onSubmit,
  onDelete,
  onClose,
}: TransactionsFormModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {visible ? (
        <TransactionForm
          submitting={mutating}
          error={error}
          fieldErrors={fieldErrors}
          wallets={wallets}
          initialValues={buildTransactionFormValues(
            wallets,
            editingTransaction,
          )}
          isEditing={Boolean(editingTransaction)}
          onSubmit={onSubmit}
          onDelete={editingTransaction ? onDelete : undefined}
          onCancel={onClose}
        />
      ) : null}
    </Modal>
  );
}
