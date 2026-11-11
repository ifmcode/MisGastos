import { useMemo, useState } from "react";
import { useRouter, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/hooks/use-auth";
import { TransferFormModal } from "@/features/transfers/components/transfer-form-modal";
import { useTransferFormDialog } from "@/features/transfers/hooks/use-transfer-form-dialog";
import { useTransfers } from "@/features/transfers/hooks/use-transfers";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import { getActiveWallets } from "@/features/wallets/utils/wallet-status";

import { useDashboardOverview } from "../hooks/use-dashboard-overview";
import { dashboardStyles } from "../styles/dashboard.styles";
import { DashboardErrorState } from "./dashboard-error-state";
import { DashboardHeader } from "./dashboard-header";
import { DashboardLoadingState } from "./dashboard-loading-state";
import { DashboardWalletsList } from "./dashboard-wallets-list";

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const {
    wallets,
    loading: walletsLoading,
    refreshing: walletsRefreshing,
    error: walletsError,
    reload: reloadWallets,
    refresh: refreshWallets,
  } = useWallets();
  const {
    transfers,
    loading: transfersLoading,
    refreshing: transfersRefreshing,
    mutating,
    error: transfersError,
    createError,
    createFieldErrors,
    reload: reloadTransfers,
    refresh: refreshTransfers,
    createTransfer,
    updateTransfer,
    deleteTransfer,
    clearCreateState,
  } = useTransfers();

  const [selectedWalletId, setSelectedWalletId] = useState("");

  const activeWallets = useMemo(() => getActiveWallets(wallets), [wallets]);

  const {
    effectiveSelectedWalletId,
    selectedWallet,
    totals,
    visibleWallets,
    walletMap,
    recentTransfers,
    canTransfer,
  } = useDashboardOverview(activeWallets, transfers, selectedWalletId, wallets);

  const transferForm = useTransferFormDialog({
    mutating,
    createTransfer,
    updateTransfer,
    deleteTransfer,
    clearCreateState,
    onWalletsChanged: () => void reloadWallets(),
  });

  const refreshing = walletsRefreshing || transfersRefreshing;
  const greeting = user?.displayName ?? user?.email ?? "Usuario";

  function handleRefresh() {
    void refreshWallets();
    void refreshTransfers();
  }

  return (
    <ThemedView
      style={[dashboardStyles.container, { paddingTop: insets.top + 16 }]}
    >
      <DashboardHeader
        greeting={`Hola, ${greeting}`}
        showTransferButton={!walletsLoading && !walletsError && canTransfer}
        onTransferPress={transferForm.openCreate}
      />

      {walletsLoading ? (
        <DashboardLoadingState />
      ) : walletsError ? (
        <DashboardErrorState
          message={walletsError}
          onRetry={() => void reloadWallets()}
        />
      ) : (
        <DashboardWalletsList
          wallets={wallets}
          activeWallets={activeWallets}
          visibleWallets={visibleWallets}
          selectedWalletId={effectiveSelectedWalletId}
          selectedWallet={selectedWallet}
          totals={totals}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onSelectWallet={setSelectedWalletId}
          transfers={recentTransfers}
          transfersLoading={transfersLoading}
          transfersError={transfersError}
          canTransfer={canTransfer}
          walletMap={walletMap}
          onRetryTransfers={() => void reloadTransfers()}
          onOpenHistory={() => router.push("/transfers" as Href)}
          onPressTransfer={transferForm.openEdit}
        />
      )}

      <TransferFormModal
        visible={transferForm.visible}
        wallets={activeWallets}
        walletLookup={wallets}
        editingTransfer={transferForm.editingTransfer}
        submitting={mutating}
        error={createError}
        fieldErrors={createFieldErrors}
        onSubmit={(input) => void transferForm.submit(input)}
        onDelete={transferForm.deleteEditing}
        onClose={transferForm.close}
      />
    </ThemedView>
  );
}
