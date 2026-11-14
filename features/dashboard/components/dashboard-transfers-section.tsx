import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { TransferItem } from "@/features/transfers/components/transfer-item";
import { Transfer } from "@/features/transfers/types/transfer.types";
import { OPEN_TRANSFER_DETAIL_HINT_KEY } from "@/features/transfers/utils/transfer-item-accessibility";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { EmptyState } from "@/shared/components/molecules/empty-state";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { asTranslate } from "@/shared/i18n/translate";

import { dashboardStyles } from "../styles/dashboard.styles";
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
        <LoadingState
          message={t("transfers.loading")}
          variant="inline"
          size="small"
        />
      ) : error ? (
        <ErrorState
          message={error}
          retryLabel={t("transfers.retry")}
          retryAccessibilityLabel={t("transfers.retryAccessibility")}
          onRetry={onRetry}
          variant="inline"
        />
      ) : transfers.length === 0 ? (
        <EmptyState
          title={t("transfers.emptyTitle")}
          message={tr(getTransfersEmptyMessageKey(canTransfer))}
          variant="card"
        />
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
