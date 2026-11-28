import { useTranslation } from "react-i18next";
import { FlatList, View } from "react-native";

import { EmptyState } from "@/shared/components/molecules/empty-state";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";

import type { WalletReorder } from "../hooks/use-wallet-reorder";
import { walletsStyles } from "../styles/wallets.styles";
import { Wallet } from "../types/wallet.types";
import { WalletTotal } from "../utils/money";
import { WalletCard } from "./wallet-card";
import { WalletsArchivedSection } from "./wallets-archived-section";
import { WalletsListHeader } from "./wallets-list-header";

export interface WalletsListProps {
  wallets: readonly Wallet[];
  activeWallets: readonly Wallet[];
  archivedWallets: readonly Wallet[];
  totals: WalletTotal[];
  loading: boolean;
  error: string | null;
  reorder: WalletReorder;
  onReload: () => void;
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
  error,
  reorder,
  onReload,
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
      renderItem={({ item, index }) => (
        <WalletCard
          wallet={item}
          onPress={reorder.reordering ? undefined : onWalletPress}
          reorder={
            reorder.reordering
              ? {
                  canMoveUp: index > 0,
                  canMoveDown: index < activeWallets.length - 1,
                  disabled: reorder.saving,
                  onMoveUp: () => reorder.move(item.id, "up"),
                  onMoveDown: () => reorder.move(item.id, "down"),
                }
              : undefined
          }
        />
      )}
      ItemSeparatorComponent={WalletSeparator}
      ListHeaderComponent={
        <WalletsListHeader
          totals={totals}
          canReorder={activeWallets.length > 1}
          reorder={reorder}
        />
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
          onWalletPress={reorder.reordering ? undefined : onWalletPress}
        />
      }
      contentContainerStyle={[
        walletsStyles.listContent,
        wallets.length === 0 && walletsStyles.emptyListContent,
      ]}
      showsVerticalScrollIndicator={false}
    />
  );
}
