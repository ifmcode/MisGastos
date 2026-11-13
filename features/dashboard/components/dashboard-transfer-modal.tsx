import { useMemo } from "react";

import { TransferFormModal } from "@/features/transfers/components/transfer-form-modal";
import { TransferFormDialog } from "@/features/transfers/hooks/use-transfer-form-dialog";
import { TransferValidationErrors } from "@/features/transfers/schemas/transfer.schema";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { getActiveWallets } from "@/features/wallets/utils/wallet-status";

export interface DashboardTransferModalState {
  mutating: boolean;
  createError: string | null;
  createFieldErrors: TransferValidationErrors;
}

export interface DashboardTransferModalProps {
  form: TransferFormDialog;
  state: DashboardTransferModalState;
  wallets: readonly Wallet[];
}

/**
 * Renders the shared transfer form used to edit a recent transfer, reusing the
 * existing dialog and mutations. The dashboard only opens it in edit mode.
 */
export function DashboardTransferModal({
  form,
  state,
  wallets,
}: DashboardTransferModalProps) {
  const activeWallets = useMemo(() => getActiveWallets(wallets), [wallets]);

  return (
    <TransferFormModal
      visible={form.visible}
      wallets={activeWallets}
      walletLookup={wallets}
      editingTransfer={form.editingTransfer}
      submitting={state.mutating}
      error={state.createError}
      fieldErrors={state.createFieldErrors}
      onSubmit={(input) => void form.submit(input)}
      onDelete={form.deleteEditing}
      onClose={form.close}
    />
  );
}
