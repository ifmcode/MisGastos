import { TransferFormModal } from "@/features/transfers/components/transfer-form-modal";
import { canTransferBetweenWallets } from "@/features/transfers/utils/transfer-wallets";

import { useWalletsTransferAction } from "../hooks/use-wallets-transfer-action";
import { Wallet } from "../types/wallet.types";
import { WalletsQuickActions } from "./wallets-quick-actions";

export interface WalletsTransferActionsProps {
  activeWallets: Wallet[];
  walletLookup: readonly Wallet[];
  onWalletsChanged: () => void;
  onHistoryPress: () => void;
}

/**
 * Transfer entry point of the wallets tab. Reuses the shared transfer form and
 * the same eligibility rule as the dashboard so both cannot drift.
 */
export function WalletsTransferActions({
  activeWallets,
  walletLookup,
  onWalletsChanged,
  onHistoryPress,
}: WalletsTransferActionsProps) {
  const { transfers, form } = useWalletsTransferAction(onWalletsChanged);

  return (
    <>
      <WalletsQuickActions
        canTransfer={canTransferBetweenWallets(activeWallets)}
        onTransferPress={form.openCreate}
        onHistoryPress={onHistoryPress}
      />

      <TransferFormModal
        visible={form.visible}
        wallets={activeWallets}
        walletLookup={walletLookup}
        editingTransfer={form.editingTransfer}
        submitting={transfers.mutating}
        error={transfers.createError}
        fieldErrors={transfers.createFieldErrors}
        onSubmit={(input) => void form.submit(input)}
        onDelete={form.deleteEditing}
        onClose={form.close}
      />
    </>
  );
}
