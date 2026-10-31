import { Modal } from "react-native";

import { TransferForm } from "@/features/transfers/components/transfer-form";
import {
  TransferInput,
  TransferValidationErrors,
} from "@/features/transfers/schemas/transfer.schema";
import { Transfer } from "@/features/transfers/types/transfer.types";
import { Wallet } from "@/features/wallets/types/wallet.types";

import { buildTransferFormValues } from "../utils/dashboard-transfer-defaults";

export interface DashboardTransferModalProps {
  visible: boolean;
  wallets: Wallet[];
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
  editingTransfer,
  submitting,
  error,
  fieldErrors,
  onSubmit,
  onDelete,
  onClose,
}: DashboardTransferModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {visible ? (
        <TransferForm
          submitting={submitting}
          error={error}
          fieldErrors={fieldErrors}
          wallets={wallets}
          isEditing={Boolean(editingTransfer)}
          editingTransfer={editingTransfer}
          initialValues={buildTransferFormValues(wallets, editingTransfer)}
          onSubmit={onSubmit}
          onDelete={editingTransfer ? onDelete : undefined}
          onCancel={onClose}
        />
      ) : null}
    </Modal>
  );
}
