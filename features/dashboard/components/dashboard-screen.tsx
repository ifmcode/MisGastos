import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/hooks/use-auth";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { TransferFormModal } from "@/features/transfers/components/transfer-form-modal";
import { useTransferFormDialog } from "@/features/transfers/hooks/use-transfer-form-dialog";
import { useTransfers } from "@/features/transfers/hooks/use-transfers";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import { getActiveWallets } from "@/features/wallets/utils/wallet-status";

import { useDashboardOverview } from "../hooks/use-dashboard-overview";
import { dashboardStyles } from "../styles/dashboard.styles";
import { createDashboardNavigationActions } from "../utils/dashboard-navigation";
import { DashboardErrorState } from "./dashboard-error-state";
import { DashboardHeader } from "./dashboard-header";
import { DashboardLoadingState } from "./dashboard-loading-state";
import { DashboardOverviewScroll } from "./dashboard-overview-scroll";

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const walletsState = useWallets();
  const transfersState = useTransfers();
  const categoriesState = useCategories();
  const transactionsState = useTransactions({
    categories: categoriesState.categories,
  });

  const [selectedWalletId, setSelectedWalletId] = useState("");
  const activeWallets = useMemo(
    () => getActiveWallets(walletsState.wallets),
    [walletsState.wallets],
  );
  const overview = useDashboardOverview({
    wallets: activeWallets,
    allWallets: walletsState.wallets,
    transfers: transfersState.transfers,
    transactions: transactionsState.transactions,
    selectedWalletId,
  });
  const navigation = useMemo(
    () => createDashboardNavigationActions(router),
    [router],
  );
  const transferForm = useTransferFormDialog({
    mutating: transfersState.mutating,
    createTransfer: transfersState.createTransfer,
    updateTransfer: transfersState.updateTransfer,
    deleteTransfer: transfersState.deleteTransfer,
    clearCreateState: transfersState.clearCreateState,
    onWalletsChanged: () => void walletsState.reload(),
  });

  const refreshing =
    walletsState.refreshing ||
    transfersState.refreshing ||
    transactionsState.refreshing ||
    categoriesState.refreshing;
  const greeting = user?.displayName ?? user?.email ?? "Usuario";

  function handleRefresh() {
    void walletsState.refresh();
    void transfersState.refresh();
    void transactionsState.refresh();
    void categoriesState.refresh();
  }

  function retryMovements() {
    void transactionsState.reload();
    void categoriesState.reload();
  }

  return (
    <ThemedView
      style={[dashboardStyles.container, { paddingTop: insets.top + 16 }]}
    >
      <DashboardHeader
        greeting={`Hola, ${greeting}`}
        showTransferButton={
          !walletsState.loading && !walletsState.error && overview.canTransfer
        }
        onTransferPress={transferForm.openCreate}
      />

      {walletsState.loading ? (
        <DashboardLoadingState />
      ) : walletsState.error ? (
        <DashboardErrorState
          message={walletsState.error}
          onRetry={() => void walletsState.reload()}
        />
      ) : (
        <DashboardOverviewScroll
          filters={{
            wallets: activeWallets,
            selectedWalletId: overview.effectiveSelectedWalletId,
            onSelect: setSelectedWalletId,
          }}
          summary={{
            totals: overview.totals,
            selectedWallet: overview.selectedWallet,
          }}
          movements={{
            movements: overview.recentMovements,
            categories: categoriesState.categories,
            walletMap: overview.walletMap,
            loading: transactionsState.loading || categoriesState.loading,
            error: transactionsState.error ?? categoriesState.error,
            hasMore: overview.hasMoreMovements,
            onRetry: retryMovements,
            onOpenMovements: navigation.openMovements,
            onPressMovement: navigation.openMovements,
          }}
          transfers={{
            transfers: overview.recentTransfers,
            loading: transfersState.loading,
            error: transfersState.error,
            hasMore: overview.hasMoreTransfers,
            canTransfer: overview.canTransfer,
            walletMap: overview.walletMap,
            onRetry: () => void transfersState.reload(),
            onOpenHistory: navigation.openTransferHistory,
            onPressTransfer: transferForm.openEdit,
          }}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      <TransferFormModal
        visible={transferForm.visible}
        wallets={activeWallets}
        walletLookup={walletsState.wallets}
        editingTransfer={transferForm.editingTransfer}
        submitting={transfersState.mutating}
        error={transfersState.createError}
        fieldErrors={transfersState.createFieldErrors}
        onSubmit={(input) => void transferForm.submit(input)}
        onDelete={transferForm.deleteEditing}
        onClose={transferForm.close}
      />
    </ThemedView>
  );
}
