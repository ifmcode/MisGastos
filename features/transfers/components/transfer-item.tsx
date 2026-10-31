import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatDateInput } from "@/features/transactions/utils/transaction-date";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { formatMoney } from "@/features/wallets/utils/money";

import { Transfer } from "../types/transfer.types";

export interface TransferItemProps {
  transfer: Transfer;
  fromWallet?: Wallet;
  toWallet?: Wallet;
  onPress?: () => void;
}

export function TransferItem({
  transfer,
  fromWallet,
  toWallet,
  onPress,
}: TransferItemProps) {
  const colorScheme = useColorScheme() ?? "light";
  const borderColor = colorScheme === "dark" ? "#2B3438" : "#E4ECEF";

  const fromName = fromWallet?.name ?? "Cartera eliminada";
  const toName = toWallet?.name ?? "Cartera eliminada";

  return (
    <ThemedView
      onTouchEnd={onPress}
      style={[styles.card, { borderColor }]}
      lightColor="#FFFFFF"
      darkColor="#1C2225"
    >
      <View style={styles.iconWrapper}>
        <Ionicons name="swap-horizontal" size={20} color="#0A7EA4" />
      </View>

      <View style={styles.details}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {fromName} → {toName}
        </ThemedText>
        <ThemedText style={styles.meta} numberOfLines={1}>
          {formatDateInput(transfer.date)}
          {transfer.notes ? ` · ${transfer.notes}` : ""}
        </ThemedText>
      </View>

      <ThemedText
        type="defaultSemiBold"
        style={styles.amount}
        numberOfLines={1}
      >
        {formatMoney(transfer.amount, transfer.currency)}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 126, 164, 0.12)",
  },
  details: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.65,
    marginTop: 2,
  },
  amount: {
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
});
