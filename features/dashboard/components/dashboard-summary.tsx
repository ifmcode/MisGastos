import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { formatMoney, WalletTotal } from "@/features/wallets/utils/money";

export interface DashboardSummaryProps {
  totals: readonly WalletTotal[];
  selectedWallet: Wallet | null;
}

export function DashboardSummary({
  totals,
  selectedWallet,
}: DashboardSummaryProps) {
  const label = selectedWallet
    ? `Saldo de ${selectedWallet.name}`
    : "Saldo total";

  const hint = selectedWallet
    ? selectedWallet.includeInTotal
      ? "Esta cartera se suma al total global."
      : "Esta cartera está fuera del total global."
    : "Solo se suman las carteras incluidas en el total.";

  return (
    <ThemedView style={styles.card} lightColor="#0A7EA4" darkColor="#0B3F52">
      <View style={styles.header}>
        <ThemedText style={styles.label} numberOfLines={1}>
          {label}
        </ThemedText>
        <Ionicons
          name={selectedWallet ? "wallet-outline" : "stats-chart-outline"}
          size={20}
          color="#D8F1F7"
        />
      </View>

      {totals.length === 0 ? (
        <ThemedText style={styles.emptyTotal}>
          No hay saldo incluido en el total.
        </ThemedText>
      ) : (
        totals.map((total, index) => (
          <View
            key={total.currency}
            style={[styles.row, index > 0 && styles.rowDivider]}
          >
            <ThemedText style={styles.currency}>{total.currency}</ThemedText>
            <ThemedText
              style={[styles.amount, total.total < 0 && styles.negative]}
            >
              {formatMoney(total.total, total.currency)}
            </ThemedText>
          </View>
        ))
      )}

      <ThemedText style={styles.hint}>{hint}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 6,
  },
  label: {
    flex: 1,
    color: "#D8F1F7",
    fontSize: 14,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 4,
    gap: 12,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255, 255, 255, 0.25)",
    marginTop: 6,
  },
  currency: {
    color: "#D8F1F7",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
  },
  amount: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  negative: {
    color: "#FFD6D6",
  },
  emptyTotal: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  hint: {
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: 12,
    marginTop: 10,
  },
});
