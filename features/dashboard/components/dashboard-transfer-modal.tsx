import { Modal, View } from "react-native";

import { TransferForm } from "@/features/transfers/components/transfer-form";
import {
  TransferInput,
  TransferValidationErrors,
} from "@/features/transfers/schemas/transfer.schema";
import { Transfer } from "@/features/transfers/types/transfer.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { ConfirmDialog } from "@/shared/components/molecules/confirm-dialog";
import { confirmDialogStyles } from "@/shared/components/molecules/confirm-dialog.styles";
import { useConfirmDialog } from "@/shared/hooks/use-confirm-dialog";

import { buildTransferFormValues } from "../utils/dashboard-transfer-defaults";
import { getDeleteTransferConfirmation } from "../utils/transfer-delete-dialog";

export interface DashboardTransferModalProps {
  visible: boolean;
  wallets: Wallet[];
  /** All wallets, including archived ones, used only for history labels. */
  walletLookup?: readonly Wallet[];
  editingTransfer: Transfer | null;
  submitting: boolean;
  error: string | null;
  fieldErrors: TransferValidationErrors;
  onSubmit: (input: TransferInput) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function DashboardTransferModal({
  visible,
  wallets,
  walletLookup = wallets,
  editingTransfer,
  submitting,
  error,
  fieldErrors,
  onSubmit,
  onDelete,
  onClose,
}: DashboardTransferModalProps) {
  const deleteDialog = useConfirmDialog();
  const deleteConfirmation = editingTransfer
    ? getDeleteTransferConfirmation(editingTransfer, walletLookup)
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
          <TransferForm
            submitting={submitting}
            error={error}
            fieldErrors={fieldErrors}
            wallets={wallets}
            isEditing={Boolean(editingTransfer)}
            editingTransfer={editingTransfer}
            initialValues={buildTransferFormValues(wallets, editingTransfer)}
            onSubmit={onSubmit}
            onDelete={editingTransfer ? requestDelete : undefined}
            onCancel={onClose}
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
