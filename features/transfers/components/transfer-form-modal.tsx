import { useTranslation } from "react-i18next";
import { Modal, View } from "react-native";

import { Wallet } from "@/features/wallets/types/wallet.types";
import { ConfirmDialog } from "@/shared/components/molecules/confirm-dialog";
import { confirmDialogStyles } from "@/shared/components/molecules/confirm-dialog.styles";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useConfirmDialog } from "@/shared/hooks/use-confirm-dialog";
import { asTranslate } from "@/shared/i18n/translate";

import {
  TransferInput,
  TransferValidationErrors,
} from "../schemas/transfer.schema";
import { Transfer } from "../types/transfer.types";
import { getDeleteTransferConfirmation } from "../utils/transfer-delete-dialog";
import { buildTransferFormValues } from "../utils/transfer-form-defaults";
import { TransferForm } from "./transfer-form";

export interface TransferFormModalProps {
  visible: boolean;
  wallets: Wallet[];
  walletLookup?: readonly Wallet[];
  editingTransfer: Transfer | null;
  submitting: boolean;
  error: string | null;
  fieldErrors: TransferValidationErrors;
  onSubmit: (input: TransferInput) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function TransferFormModal({
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
}: TransferFormModalProps) {
  const { t } = useTranslation("transfers");
  const tr = asTranslate(t);
  const locale = useAppLocale();
  const deleteDialog = useConfirmDialog();
  const deleteConfirmation = editingTransfer
    ? getDeleteTransferConfirmation(
        editingTransfer,
        walletLookup,
        locale.formatCurrency(
          editingTransfer.amount,
          editingTransfer.currency,
        ),
        t("deleteDialog.fallbackWallet"),
        t("deleteDialog.fallbackDeletedWallet"),
        {
          bothOrphaned: t("deleteDialog.bothOrphaned"),
          oneOrphaned: t("deleteDialog.oneOrphaned"),
          noneOrphaned: t("deleteDialog.noneOrphaned"),
        },
      )
    : null;

  function requestDelete() {
    if (!deleteConfirmation) return;

    deleteDialog.open({
      title: tr(deleteConfirmation.titleKey),
      message: tr(deleteConfirmation.messageKey, deleteConfirmation.values),
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
            initialValues={buildTransferFormValues(
              wallets,
              editingTransfer,
            )}
            isEditing={Boolean(editingTransfer)}
            editingTransfer={editingTransfer}
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
