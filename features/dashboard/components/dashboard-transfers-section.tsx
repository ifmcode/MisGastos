import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { TransferItem } from "@/features/transfers/components/transfer-item";
import { Transfer } from "@/features/transfers/types/transfer.types";
import { Wallet } from "@/features/wallets/types/wallet.types";

import { dashboardPalette, dashboardStyles } from "../styles/dashboard.styles";
import { DashboardSectionHeader } from "./dashboard-section-header";

export interface DashboardTransfersSectionProps {
  transfers: readonly Transfer[];
  loading: boolean;
  error: string | null;
  canTransfer: boolean;
  walletMap: ReadonlyMap<string, Wallet>;
  onRetry: () => void;
  onPressTransfer: (transfer: Transfer) => void;
}

export function DashboardTransfersSection({
  transfers,
  loading,
  error,
  canTransfer,
  walletMap,
  onRetry,
  onPressTransfer,
}: DashboardTransfersSectionProps) {
  return (
    <View style={dashboardStyles.footer}>
      <DashboardSectionHeader title="Transferencias recientes" />

      {loading ? (
        <View style={dashboardStyles.inlineLoading}>
          <ActivityIndicator size="small" color={dashboardPalette.primary} />
          <ThemedText style={dashboardStyles.inlineLoadingText}>
            Cargando transferencias…
          </ThemedText>
        </View>
      ) : error ? (
        <View style={dashboardStyles.inlineError}>
          <ThemedText style={dashboardStyles.inlineErrorText}>
            {error}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reintentar carga de transferencias"
            onPress={onRetry}
          >
            <ThemedText style={dashboardStyles.inlineRetryText}>
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
            {canTransfer
              ? "Usa el botón Transferir para mover dinero entre tus carteras."
              : "Necesitas al menos dos carteras con la misma moneda."}
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
