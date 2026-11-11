import { Modal, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Category } from "@/features/categories/types/category.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { ConfirmDialog } from "@/shared/components/molecules/confirm-dialog";
import { useConfirmDialog } from "@/shared/hooks/use-confirm-dialog";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionDetailStyles as styles } from "../styles/transaction-detail.styles";
import { Transaction } from "../types/transaction.types";
import { getDeleteTransactionConfirmation } from "../utils/transaction-delete-dialog";
import { TransactionDetailContent } from "./transaction-detail-content";
import { TransactionDetailHeader } from "./transaction-detail-header";
import { TransactionDetailMissingState } from "./transaction-detail-missing-state";
import { TransactionFormErrorBanner } from "./transaction-form-error-banner";

export interface TransactionDetailModalProps {
  visible: boolean;
  transaction: Transaction | null;
  wallets: readonly Wallet[];
  categories: readonly Category[];
  mutating: boolean;
  error: string | null;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => Promise<boolean>;
  onClose: () => void;
}

export function TransactionDetailModal({
  visible,
  transaction,
  wallets,
  categories,
  mutating,
  error,
  onEdit,
  onDelete,
  onClose,
}: TransactionDetailModalProps) {
  const theme = useFormTheme();
  const deleteDialog = useConfirmDialog();
  const deleteConfirmation = transaction
    ? getDeleteTransactionConfirmation(transaction, wallets)
    : null;

  function closeDetail() {
    deleteDialog.close();
    onClose();
  }

  async function confirmDelete(transactionId: string) {
    const deleted = await onDelete(transactionId);
    if (deleted) closeDetail();
  }

  function requestDelete() {
    if (!transaction || !deleteConfirmation) return;

    deleteDialog.open({
      ...deleteConfirmation,
      onConfirm: () => {
        void confirmDelete(transaction.id);
      },
    });
  }

  function handleRequestClose() {
    if (deleteDialog.visible) {
      deleteDialog.close();
      return;
    }

    closeDetail();
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
        <SafeAreaView
          style={[styles.safeArea, { backgroundColor: theme.background }]}
        >
          <View style={styles.container}>
            {transaction ? (
              <>
                <TransactionDetailHeader
                  transaction={transaction}
                  disabled={mutating}
                  onEdit={() => onEdit(transaction)}
                  onDelete={requestDelete}
                  onClose={closeDetail}
                />

                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <TransactionFormErrorBanner error={error} />
                  <TransactionDetailContent
                    transaction={transaction}
                    wallets={wallets}
                    categories={categories}
                  />
                </ScrollView>
              </>
            ) : (
              <TransactionDetailMissingState onClose={closeDetail} />
            )}

            {transaction ? (
              <ConfirmDialog
                visible={deleteDialog.visible}
                title={deleteDialog.title}
                message={deleteDialog.message}
                confirmLabel={deleteDialog.confirmLabel}
                cancelLabel={deleteDialog.cancelLabel}
                onConfirm={deleteDialog.confirm}
                onCancel={deleteDialog.close}
              />
            ) : null}
          </View>
        </SafeAreaView>
      ) : null}
    </Modal>
  );
}
