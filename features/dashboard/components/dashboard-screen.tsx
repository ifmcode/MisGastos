import { useState } from "react";
import { FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/hooks/use-auth";
import { useTransfers } from "@/features/transfers/hooks/use-transfers";
import { WalletCard } from "@/features/wallets/components/wallet-card";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import { Wallet } from "@/features/wallets/types/wallet.types";

import { useDashboardOverview } from "../hooks/use-dashboard-overview";
import { useDashboardTransferForm } from "../hooks/use-dashboard-transfer-form";
import { dashboardStyles } from "../styles/dashboard.styles";
import { DashboardEmptyWalletsState } from "./dashboard-empty-wallets-state";
import { DashboardErrorState } from "./dashboard-error-state";
import { DashboardHeader } from "./dashboard-header";
import { DashboardListHeader } from "./dashboard-list-header";
import { DashboardLoadingState } from "./dashboard-loading-state";
import { DashboardTransferModal } from "./dashboard-transfer-modal";
import { DashboardTransfersSection } from "./dashboard-transfers-section";

function WalletSeparator() {
  return <View style={dashboardStyles.separator} />;
}

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
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

  const {
    effectiveSelectedWalletId,
    selectedWallet,
    totals,
    visibleWallets,
    walletMap,
    recentTransfers,
    canTransfer,
  } = useDashboardOverview(wallets, transfers, selectedWalletId);

  const transferForm = useDashboardTransferForm({
    walletMap,
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

  function renderWallet({ item }: { item: Wallet }) {
    return <WalletCard wallet={item} />;
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
        <FlatList
          data={visibleWallets}
          keyExtractor={(wallet) => wallet.id}
          renderItem={renderWallet}
          ItemSeparatorComponent={WalletSeparator}
          ListHeaderComponent={
            <DashboardListHeader
              wallets={wallets}
              selectedWalletId={effectiveSelectedWalletId}
              selectedWallet={selectedWallet}
              totals={totals}
              visibleWalletsCount={visibleWallets.length}
              onSelectWallet={setSelectedWalletId}
            />
          }
          ListFooterComponent={
            wallets.length > 0 ? (
              <DashboardTransfersSection
                transfers={recentTransfers}
                loading={transfersLoading}
                error={transfersError}
                canTransfer={canTransfer}
                walletMap={walletMap}
                onRetry={() => void reloadTransfers()}
                onPressTransfer={transferForm.openEdit}
              />
            ) : null
          }
          ListEmptyComponent={<DashboardEmptyWalletsState />}
          contentContainerStyle={[
            dashboardStyles.listContent,
            wallets.length === 0 && dashboardStyles.emptyListContent,
          ]}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      )}

      <DashboardTransferModal
        visible={transferForm.visible}
        wallets={wallets}
        editingTransfer={transferForm.editingTransfer}
        submitting={mutating}
        error={createError}
        fieldErrors={createFieldErrors}
        onSubmit={(input) => void transferForm.submit(input)}
        onDelete={transferForm.requestDelete}
        onClose={transferForm.close}
      />
    </ThemedView>
  );
}
