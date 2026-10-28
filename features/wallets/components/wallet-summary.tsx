import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { formatMoney, WalletTotal } from "../utils/money";

export interface WalletSummaryProps {
  totals: readonly WalletTotal[];
}

export function WalletSummary({ totals }: WalletSummaryProps) {
  if (totals.length === 0) return null;

  return (
    <ThemedView
      style={styles.card}
      lightColor="#0A7EA4"
      darkColor="#0B3F52"
    >
      <View style={styles.header}>
        <ThemedText style={styles.label}>Saldo total</ThemedText>
        <Ionicons name="wallet-outline" size={20} color="#D8F1F7" />
      </View>

      {totals.map((total, index) => (
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
      ))}

      <ThemedText style={styles.hint}>
        Solo se suman las carteras incluidas en el total.
      </ThemedText>
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
    marginBottom: 6,
  },
  label: {
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
  },
  negative: {
    color: "#FFD6D6",
  },
  hint: {
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: 12,
    marginTop: 10,
  },
});
