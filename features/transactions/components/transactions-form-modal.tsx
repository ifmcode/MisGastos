import { Modal } from "react-native";

import { Category } from "@/features/categories/types/category.types";
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
  categories: readonly Category[];
  editingTransaction: Transaction | null;
  onSubmit: (input: TransactionInput) => void;
  onDelete: () => void;
  onClose: () => void;
  onCategoryCreated?: (category: Category) => void;
}

export function TransactionsFormModal({
  visible,
  mutating,
  error,
  fieldErrors,
  wallets,
  categories,
  editingTransaction,
  onSubmit,
  onDelete,
  onClose,
  onCategoryCreated,
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
          categories={categories}
          initialValues={buildTransactionFormValues(
            wallets,
            editingTransaction,
            categories,
          )}
          isEditing={Boolean(editingTransaction)}
          onSubmit={onSubmit}
          onDelete={editingTransaction ? onDelete : undefined}
          onCancel={onClose}
          onCategoryCreated={onCategoryCreated}
        />
      ) : null}
    </Modal>
  );
}
