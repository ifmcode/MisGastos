import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { TransferItem } from "@/features/transfers/components/transfer-item";
import { Transfer } from "@/features/transfers/types/transfer.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { dashboardPalette, dashboardStyles } from "../styles/dashboard.styles";
import { getTransfersEmptyMessage } from "../utils/dashboard-transfers-copy";
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

  return (
    <View style={dashboardStyles.recentSection}>
      <DashboardSectionHeader
        title="Transferencias recientes"
        actionLabel={hasMore ? "Ver historial" : undefined}
        onActionPress={hasMore ? onOpenHistory : undefined}
      />

      {loading ? (
        <View style={dashboardStyles.inlineLoading}>
          <ActivityIndicator size="small" color={dashboardPalette.primary} />
          <ThemedText style={dashboardStyles.inlineLoadingText}>
            Cargando transferencias…
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
            accessibilityLabel="Reintentar carga de transferencias"
            onPress={onRetry}
          >
            <ThemedText
              style={[dashboardStyles.inlineRetryText, { color: theme.danger }]}
            >
              Reintentar
            </ThemedText>
          </Pressable>
        </View>
      ) : transfers.length === 0 ? (
        <View style={dashboardStyles.transferEmptyCard}>
          <ThemedText type="defaultSemiBold">
            Aún no has hecho transferencias
          </ThemedText>
          <ThemedText style={dashboardStyles.transferEmptyText}>
            {getTransfersEmptyMessage(canTransfer)}
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
              onPress={() => onPressTransfer(transfer)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
