import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/hooks/use-auth";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useTransfers } from "@/features/transfers/hooks/use-transfers";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import { getActiveWallets } from "@/features/wallets/utils/wallet-status";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { DEFAULT_CURRENCY } from "@/shared/constants/currencies";

import { useDashboardMovementDialogs } from "../hooks/use-dashboard-movement-dialogs";
import { useDashboardNotifications } from "../hooks/use-dashboard-notifications";
import { useDashboardOverview } from "../hooks/use-dashboard-overview";
import { useDashboardRefresh } from "../hooks/use-dashboard-refresh";
import { useDashboardTransferDialogs } from "../hooks/use-dashboard-transfer-dialogs";
import { dashboardStyles } from "../styles/dashboard.styles";
import { createDashboardNavigationActions } from "../utils/dashboard-navigation";
import { DashboardHeader } from "./dashboard-header";
import { DashboardDialogs } from "./dashboard-dialogs";
import { DashboardOverviewScroll } from "./dashboard-overview-scroll";

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation(["dashboard", "common"]);
  const { user } = useAuth();
  const { profile } = useProfile();
  const preferredCurrency = profile?.preferredCurrency ?? DEFAULT_CURRENCY;
  const walletsState = useWallets();
  const transfersState = useTransfers();
  const categoriesState = useCategories();
  const notificationsState = useDashboardNotifications();
  const transactionsState = useTransactions({
    categories: categoriesState.categories,
  });

  const [selectedWalletId, setSelectedWalletId] = useState("");
  // Other tabs edit this data; refresh it when the screen regains focus.
  const dashboardRefresh = useDashboardRefresh({
    wallets: walletsState,
    transfers: transfersState,
    transactions: transactionsState,
  });

  const activeWallets = useMemo(() => getActiveWallets(walletsState.wallets), [walletsState.wallets]);
  const overview = useDashboardOverview({
    wallets: activeWallets,
    allWallets: walletsState.wallets,
    transfers: transfersState.transfers,
    transactions: transactionsState.transactions,
    selectedWalletId,
  });
  const navigation = useMemo(() => createDashboardNavigationActions(router), [router]);
  const transferDialogs = useDashboardTransferDialogs({
    transfers: transfersState.transfers,
    mutations: transfersState,
    onWalletsChanged: walletsState.refresh,
  });
  const movementDialogs = useDashboardMovementDialogs({
    transactions: transactionsState.transactions,
    mutations: transactionsState,
    onWalletsChanged: walletsState.refresh,
    onOpenSharedExpense: navigation.openSharedExpense,
    onOpenGroupExpense: navigation.openGroupExpense,
    onOpenGroupSettlement: navigation.openGroupSettlement,
    onOpenSettlement: navigation.openSettlement,
  });
  const greeting = t("greeting", { name: profile?.displayName ?? user?.displayName ?? user?.email ?? t("defaultUser") });

  return (
    <ThemedView
      style={[dashboardStyles.container, { paddingTop: insets.top + 16 }]}
    >
      <DashboardHeader
        greeting={greeting}
        unreadCount={notificationsState.unreadCount}
        onOpenNotifications={notificationsState.openNotifications}
      />

      {walletsState.loading ? (
        <LoadingState message={t("loadingSummary")} />
      ) : walletsState.error ? (
        <ErrorState
          title={t("errorTitle")}
          message={walletsState.error}
          retryLabel={t("common:actions.retry")}
          retryAccessibilityLabel={t("retryAccessibility")}
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
            onRetry: () => {
              dashboardRefresh.retryMovements();
              void categoriesState.reload();
            },
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
        />
      )}

      <DashboardDialogs
        transferDialogs={transferDialogs}
        transferState={transfersState}
        movementDialogs={movementDialogs}
        movementMutations={transactionsState}
        wallets={walletsState.wallets}
        activeWallets={activeWallets}
        categories={categoriesState.categories}
        preferredCurrency={preferredCurrency}
        onCategoryCreated={categoriesState.addCategory}
      />
    </ThemedView>
  );
}
