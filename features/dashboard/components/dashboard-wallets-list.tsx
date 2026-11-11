import { FlatList, View } from "react-native";

import { Transfer } from "@/features/transfers/types/transfer.types";
import { WalletCard } from "@/features/wallets/components/wallet-card";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { WalletTotal } from "@/features/wallets/utils/money";

import { dashboardStyles } from "../styles/dashboard.styles";
import { DashboardEmptyWalletsState } from "./dashboard-empty-wallets-state";
import { DashboardListHeader } from "./dashboard-list-header";
import { DashboardTransfersSection } from "./dashboard-transfers-section";

export interface DashboardWalletsListProps {
  wallets: readonly Wallet[];
  activeWallets: readonly Wallet[];
  visibleWallets: readonly Wallet[];
  selectedWalletId: string;
  selectedWallet: Wallet | null;
  totals: readonly WalletTotal[];
  refreshing: boolean;
  onRefresh: () => void;
  onSelectWallet: (walletId: string) => void;
  transfers: readonly Transfer[];
  transfersLoading: boolean;
  transfersError: string | null;
  canTransfer: boolean;
  walletMap: ReadonlyMap<string, Wallet>;
  onRetryTransfers: () => void;
  onOpenHistory: () => void;
  onPressTransfer: (transfer: Transfer) => void;
}

function WalletSeparator() {
  return <View style={dashboardStyles.separator} />;
}

/** Wallet list with summary, archived wallets and the recent transfers footer. */
export function DashboardWalletsList({
  wallets,
  activeWallets,
  visibleWallets,
  selectedWalletId,
  selectedWallet,
  totals,
  refreshing,
  onRefresh,
  onSelectWallet,
  transfers,
  transfersLoading,
  transfersError,
  canTransfer,
  walletMap,
  onRetryTransfers,
  onOpenHistory,
  onPressTransfer,
}: DashboardWalletsListProps) {
  function renderWallet({ item }: { item: Wallet }) {
    return <WalletCard wallet={item} />;
  }

  return (
    <FlatList
      data={visibleWallets}
      keyExtractor={(wallet) => wallet.id}
      renderItem={renderWallet}
      ItemSeparatorComponent={WalletSeparator}
      ListHeaderComponent={
        <DashboardListHeader
          wallets={activeWallets}
          selectedWalletId={selectedWalletId}
          selectedWallet={selectedWallet}
          totals={totals}
          visibleWalletsCount={visibleWallets.length}
          onSelectWallet={onSelectWallet}
        />
      }
      ListFooterComponent={
        wallets.length > 0 ? (
          <DashboardTransfersSection
            transfers={transfers}
            loading={transfersLoading}
            error={transfersError}
            canTransfer={canTransfer}
            walletMap={walletMap}
            onRetry={onRetryTransfers}
            onOpenHistory={onOpenHistory}
            onPressTransfer={onPressTransfer}
          />
        ) : undefined
      }
      ListEmptyComponent={<DashboardEmptyWalletsState />}
      contentContainerStyle={[
        dashboardStyles.listContent,
        activeWallets.length === 0 && dashboardStyles.emptyListContent,
      ]}
      refreshing={refreshing}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={false}
    />
  );
}
