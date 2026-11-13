import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/hooks/use-auth";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useTransfers } from "@/features/transfers/hooks/use-transfers";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import { getActiveWallets } from "@/features/wallets/utils/wallet-status";

import { useDashboardMovementDialogs } from "../hooks/use-dashboard-movement-dialogs";
import { useDashboardOverview } from "../hooks/use-dashboard-overview";
import { useDashboardRefresh } from "../hooks/use-dashboard-refresh";
import { useDashboardTransferDialogs } from "../hooks/use-dashboard-transfer-dialogs";
import { dashboardStyles } from "../styles/dashboard.styles";
import { createDashboardNavigationActions } from "../utils/dashboard-navigation";
import { DashboardErrorState } from "./dashboard-error-state";
import { DashboardHeader } from "./dashboard-header";
import { DashboardLoadingState } from "./dashboard-loading-state";
import { DashboardMovementModals } from "./dashboard-movement-modals";
import { DashboardOverviewScroll } from "./dashboard-overview-scroll";
import { DashboardTransferModals } from "./dashboard-transfer-modals";

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const { user } = useAuth();
  const walletsState = useWallets();
  const transfersState = useTransfers();
  const categoriesState = useCategories();
  const transactionsState = useTransactions({
    categories: categoriesState.categories,
  });

  const [selectedWalletId, setSelectedWalletId] = useState("");

  // Other tabs create and edit this data, so the dashboard refreshes it when
  // the screen regains focus instead of keeping the first mount.
  const dashboardRefresh = useDashboardRefresh({
    wallets: walletsState,
    transfers: transfersState,
    transactions: transactionsState,
    categories: categoriesState,
  });

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
  const transferDialogs = useDashboardTransferDialogs({
    transfers: transfersState.transfers,
    mutations: transfersState,
    onWalletsChanged: walletsState.refresh,
  });
  const movementDialogs = useDashboardMovementDialogs({
    transactions: transactionsState.transactions,
    mutations: transactionsState,
    onWalletsChanged: walletsState.refresh,
  });

  const greetingName = user?.displayName ?? user?.email ?? t("defaultUser");
  const greeting = t("greeting", { name: greetingName });

  return (
    <ThemedView
      style={[dashboardStyles.container, { paddingTop: insets.top + 16 }]}
    >
      <DashboardHeader greeting={greeting} />

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
            onRetry: dashboardRefresh.retryMovements,
            onOpenMovements: navigation.openMovements,
            onPressMovement: movementDialogs.openDetail,
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
            onPressTransfer: transferDialogs.openDetail,
          }}
          refreshing={dashboardRefresh.refreshing}
          onRefresh={dashboardRefresh.refreshAll}
        />
      )}

      <DashboardTransferModals
        dialogs={transferDialogs}
        state={transfersState}
        wallets={walletsState.wallets}
      />

      <DashboardMovementModals
        dialogs={movementDialogs}
        mutations={transactionsState}
        wallets={walletsState.wallets}
        activeWallets={activeWallets}
        categories={categoriesState.categories}
        onCategoryCreated={categoriesState.addCategory}
      />
    </ThemedView>
  );
}
