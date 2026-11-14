import { PageSheetFormModal } from "@/shared/components/molecules/page-sheet-form-modal";

import { WalletInput, WalletValidationErrors } from "../schemas/wallet.schema";
import { WalletFormValues } from "../types/wallet.types";
import { WalletForm } from "./wallet-form";

export interface WalletsFormModalProps {
  visible: boolean;
  mode?: "create" | "edit";
  initialValues?: WalletFormValues;
  initialBalanceLocked?: boolean;
  submitting: boolean;
  error: string | null;
  fieldErrors: WalletValidationErrors;
  onSubmit: (input: WalletInput) => void;
  onClose: () => void;
}

export function WalletsFormModal({
  visible,
  mode = "create",
  initialValues,
  initialBalanceLocked = false,
  submitting,
  error,
  fieldErrors,
  onSubmit,
  onClose,
}: WalletsFormModalProps) {
  return (
    <PageSheetFormModal visible={visible} onRequestClose={onClose}>
      <WalletForm
        mode={mode}
        initialValues={initialValues}
        initialBalanceLocked={initialBalanceLocked}
        submitting={submitting}
        error={error}
        fieldErrors={fieldErrors}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </PageSheetFormModal>
  );
}
