import { useMemo } from "react";

import { TransferDetailModal } from "@/features/transfers/components/transfer-detail-modal";
import { TransferFormModal } from "@/features/transfers/components/transfer-form-modal";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { getActiveWallets } from "@/features/wallets/utils/wallet-status";

import {
  DashboardTransferDialogs,
  DashboardTransferMutations,
} from "../hooks/use-dashboard-transfer-dialogs";

export interface DashboardTransferModalsProps {
  dialogs: DashboardTransferDialogs;
  state: DashboardTransferMutations;
  wallets: readonly Wallet[];
}

/**
 * Read-only detail plus the existing edit form for a recent transfer, composed
 * exactly like the movement dialogs so both entries share one flow.
 */
export function DashboardTransferModals({
  dialogs,
  state,
  wallets,
}: DashboardTransferModalsProps) {
  const activeWallets = useMemo(() => getActiveWallets(wallets), [wallets]);
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
