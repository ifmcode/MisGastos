import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { TransferItem } from "@/features/transfers/components/transfer-item";
import { Transfer } from "@/features/transfers/types/transfer.types";
import { OPEN_TRANSFER_DETAIL_HINT_KEY } from "@/features/transfers/utils/transfer-item-accessibility";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { asTranslate } from "@/shared/i18n/translate";

import { dashboardPalette, dashboardStyles } from "../styles/dashboard.styles";
import { getTransfersEmptyMessageKey } from "../utils/dashboard-transfers-copy";
import { DashboardSectionHeader } from "./dashboard-section-header";

export interface DashboardTransfersSectionProps {
  transfers: readonly Transfer[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  canTransfer: boolean;
  walletMap: ReadonlyMap<string, Wallet>;
  onRetry: () => void;
  onOpenHistory: () => void;
  onPressTransfer: (transfer: Transfer) => void;
}

export function DashboardTransfersSection({
  transfers,
  loading,
  error,
  hasMore,
  canTransfer,
  walletMap,
  onRetry,
  onOpenHistory,
  onPressTransfer,
}: DashboardTransfersSectionProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("dashboard");
  const { t: tTransfers } = useTranslation("transfers");
  const tr = asTranslate(t);

  return (
    <View style={dashboardStyles.recentSection}>
      <DashboardSectionHeader
        title={t("transfers.title")}
        actionLabel={hasMore ? t("transfers.viewAll") : undefined}
        actionAccessibilityLabel={
          hasMore ? t("transfers.viewAllAccessibility") : undefined
        }
        onActionPress={hasMore ? onOpenHistory : undefined}
      />

      {loading ? (
        <View style={dashboardStyles.inlineLoading}>
          <ActivityIndicator size="small" color={dashboardPalette.primary} />
          <ThemedText style={dashboardStyles.inlineLoadingText}>
            {t("transfers.loading")}
          </ThemedText>
        </View>
      ) : error ? (
        <View
          style={[
            dashboardStyles.inlineError,
            { backgroundColor: theme.dangerSurface },
          ]}
        >
          <ThemedText
            style={[dashboardStyles.inlineErrorText, { color: theme.dangerText }]}
          >
            {error}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("transfers.retryAccessibility")}
            onPress={onRetry}
          >
            <ThemedText
              style={[dashboardStyles.inlineRetryText, { color: theme.danger }]}
            >
              {t("transfers.retry")}
            </ThemedText>
          </Pressable>
        </View>
      ) : transfers.length === 0 ? (
        <View style={dashboardStyles.transferEmptyCard}>
          <ThemedText type="defaultSemiBold">
            {t("transfers.emptyTitle")}
          </ThemedText>
          <ThemedText style={dashboardStyles.transferEmptyText}>
            {tr(getTransfersEmptyMessageKey(canTransfer))}
          </ThemedText>
        </View>
      ) : (
        <View style={dashboardStyles.transferList}>
          {transfers.map((transfer) => (
            <TransferItem
              key={transfer.id}
              transfer={transfer}
              fromWallet={walletMap.get(transfer.fromWalletId)}
              toWallet={walletMap.get(transfer.toWalletId)}
              labelKind="detail"
              accessibilityHint={tTransfers(OPEN_TRANSFER_DETAIL_HINT_KEY)}
              onPress={() => onPressTransfer(transfer)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
