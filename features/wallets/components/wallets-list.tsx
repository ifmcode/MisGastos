import { FlatList, View } from "react-native";

import { walletsStyles } from "../styles/wallets.styles";
import { Wallet } from "../types/wallet.types";
import { WalletTotal } from "../utils/money";
import { WalletCard } from "./wallet-card";
import { WalletSummary } from "./wallet-summary";
import { WalletsArchivedSection } from "./wallets-archived-section";
import { WalletsEmptyState } from "./wallets-empty-state";
import { WalletsErrorState } from "./wallets-error-state";
import { WalletsLoadingState } from "./wallets-loading-state";

export interface WalletsListProps {
  wallets: readonly Wallet[];
  activeWallets: readonly Wallet[];
  archivedWallets: readonly Wallet[];
  totals: WalletTotal[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onReload: () => void;
  onRefresh: () => void;
  onCreate: () => void;
  onWalletPress: (wallet: Wallet) => void;
}

function WalletSeparator() {
  return <View style={walletsStyles.separator} />;
}

/** Wallet list with loading, error, empty, summary and archived states. */
export function WalletsList({
  wallets,
  activeWallets,
  archivedWallets,
  totals,
  loading,
  refreshing,
  error,
  onReload,
  onRefresh,
  onCreate,
  onWalletPress,
}: WalletsListProps) {
  if (loading) return <WalletsLoadingState />;

  if (error) return <WalletsErrorState message={error} onRetry={onReload} />;

  return (
    <FlatList
      data={activeWallets}
      keyExtractor={(wallet) => wallet.id}
      renderItem={({ item }) => (
        <WalletCard wallet={item} onPress={onWalletPress} />
      )}
      ItemSeparatorComponent={WalletSeparator}
      ListHeaderComponent={
        totals.length > 0 ? <WalletSummary totals={totals} /> : undefined
      }
      ListEmptyComponent={
        wallets.length === 0 ? (
          <WalletsEmptyState onCreate={onCreate} />
        ) : undefined
      }
      ListFooterComponent={
        <WalletsArchivedSection
          wallets={archivedWallets}
          onWalletPress={onWalletPress}
        />
      }
      contentContainerStyle={[
        walletsStyles.listContent,
        wallets.length === 0 && walletsStyles.emptyListContent,
      ]}
      refreshing={refreshing}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={false}
    />
  );
}
