import { Modal } from "react-native";

import { WalletInput, WalletValidationErrors } from "../schemas/wallet.schema";
import { WalletForm } from "./wallet-form";

export interface WalletsFormModalProps {
  visible: boolean;
  submitting: boolean;
  error: string | null;
  fieldErrors: WalletValidationErrors;
  onSubmit: (input: WalletInput) => void;
  onClose: () => void;
}

export function WalletsFormModal({
  visible,
  submitting,
  error,
  fieldErrors,
  onSubmit,
  onClose,
}: WalletsFormModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {visible ? (
        <WalletForm
          submitting={submitting}
          error={error}
          fieldErrors={fieldErrors}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      ) : null}
    </Modal>
  );
}
