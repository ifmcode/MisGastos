import { Modal, View } from "react-native";

import { Category } from "@/features/categories/types/category.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { ConfirmDialog } from "@/shared/components/molecules/confirm-dialog";
import { confirmDialogStyles } from "@/shared/components/molecules/confirm-dialog.styles";
import { useConfirmDialog } from "@/shared/hooks/use-confirm-dialog";

import {
  TransactionInput,
  TransactionValidationErrors,
} from "../schemas/transaction.schema";
import { Transaction } from "../types/transaction.types";
import { getDeleteTransactionConfirmation } from "../utils/transaction-delete-dialog";
import { buildTransactionFormValues } from "../utils/transaction-form-defaults";
import { TransactionForm } from "./transaction-form";

export interface TransactionsFormModalProps {
  visible: boolean;
  mutating: boolean;
  error: string | null;
  fieldErrors: TransactionValidationErrors;
  wallets: Wallet[];
  /** All wallets, including archived ones, used only for history labels. */
  walletLookup?: readonly Wallet[];
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
  walletLookup = wallets,
  categories,
  editingTransaction,
  onSubmit,
  onDelete,
  onClose,
  onCategoryCreated,
}: TransactionsFormModalProps) {
  const deleteDialog = useConfirmDialog();
  const deleteConfirmation = editingTransaction
    ? getDeleteTransactionConfirmation(editingTransaction, walletLookup)
    : null;

  function requestDelete() {
    if (!deleteConfirmation) return;

    deleteDialog.open({
      ...deleteConfirmation,
      onConfirm: onDelete,
    });
  }

  function handleRequestClose() {
    if (deleteDialog.visible) {
      deleteDialog.close();
      return;
    }

    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleRequestClose}
      onDismiss={deleteDialog.close}
    >
      {visible ? (
        <View style={confirmDialogStyles.modalRoot}>
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
            onDelete={editingTransaction ? requestDelete : undefined}
            onCancel={onClose}
            onCategoryCreated={onCategoryCreated}
          />
          <ConfirmDialog
            visible={deleteDialog.visible}
            title={deleteDialog.title}
            message={deleteDialog.message}
            confirmLabel={deleteDialog.confirmLabel}
            cancelLabel={deleteDialog.cancelLabel}
            onConfirm={deleteDialog.confirm}
            onCancel={deleteDialog.close}
          />
        </View>
      ) : null}
    </Modal>
  );
}
