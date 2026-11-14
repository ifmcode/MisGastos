import { useTranslation } from "react-i18next";
import { FlatList, View } from "react-native";

import { EmptyState } from "@/shared/components/molecules/empty-state";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";

import { walletsStyles } from "../styles/wallets.styles";
import { Wallet } from "../types/wallet.types";
import { WalletTotal } from "../utils/money";
import { WalletCard } from "./wallet-card";
import { WalletSummary } from "./wallet-summary";
import { WalletsArchivedSection } from "./wallets-archived-section";

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
  const { t } = useTranslation(["wallets", "common"]);

  if (loading) return <LoadingState message={t("loading")} />;

  if (error) {
    return (
      <ErrorState
        title={t("errorTitle")}
        message={error}
        retryLabel={t("common:actions.retry")}
        retryAccessibilityLabel={t("retryAccessibility")}
        onRetry={onReload}
      />
    );
  }

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
          <EmptyState
            icon="wallet-outline"
            title={t("emptyTitle")}
            message={t("emptyMessage")}
            primaryAction={{
              label: t("create"),
              accessibilityLabel: t("createFirst"),
              onPress: onCreate,
              icon: "add",
            }}
          />
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
