import { TransferDetailModal } from "@/features/transfers/components/transfer-detail-modal";
import { TransferFormModal } from "@/features/transfers/components/transfer-form-modal";
import { Wallet } from "@/features/wallets/types/wallet.types";
import type { CurrencyCode } from "@/shared/constants/currencies";

import {
  DashboardTransferDialogs,
  DashboardTransferMutations,
} from "../hooks/use-dashboard-transfer-dialogs";

export interface DashboardTransferModalsProps {
  dialogs: DashboardTransferDialogs;
  state: DashboardTransferMutations;
  wallets: readonly Wallet[];
  /** Active wallets only: the form never selects an archived wallet. */
  activeWallets: Wallet[];
  preferredCurrency: CurrencyCode;
}

/**
 * Read-only detail plus the existing edit form for a recent transfer, composed
 * exactly like the movement dialogs so both entries share one flow.
 */
export function DashboardTransferModals({
  dialogs,
  state,
  wallets,
  activeWallets,
  preferredCurrency,
}: DashboardTransferModalsProps) {
  const { detail, form } = dialogs;

  return (
    <>
      <TransferDetailModal
        visible={detail.visible}
        transfer={detail.transfer}
        wallets={wallets}
        mutating={state.mutating}
        error={state.createError}
        onEdit={dialogs.editFromDetail}
        onDelete={dialogs.deleteTransfer}
        onClose={detail.close}
      />

      <TransferFormModal
        visible={form.visible}
        wallets={activeWallets}
        walletLookup={wallets}
        editingTransfer={form.editingTransfer}
        preferredCurrency={preferredCurrency}
        submitting={state.mutating}
        error={state.createError}
        fieldErrors={state.createFieldErrors}
        onSubmit={(input) => void form.submit(input)}
        onDelete={form.deleteEditing}
        onClose={form.close}
      />
    </>
  );
}
