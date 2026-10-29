import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { formatMoney } from "@/features/wallets/utils/money";

import { Transaction } from "../types/transaction.types";
import { formatDateInput } from "../utils/transaction-date";
import { TransactionCategory } from "../utils/transaction-options";

export interface TransactionItemProps {
  transaction: Transaction;
  wallet?: Wallet;
  category: TransactionCategory;
  onPress?: () => void;
}

export function TransactionItem({
  transaction,
  wallet,
  category,
  onPress,
}: TransactionItemProps) {
  const colorScheme = useColorScheme() ?? "light";
  const borderColor = colorScheme === "dark" ? "#2B3438" : "#E4ECEF";
  const isIncome = transaction.type === "income";
  const amountColor = isIncome ? "#2E7D32" : "#C62828";
  const amountPrefix = isIncome ? "+" : "-";

  return (
    <ThemedView
      onTouchEnd={onPress}
      style={[styles.card, { borderColor }]}
      lightColor="#FFFFFF"
      darkColor="#1C2225"
    >
      <View style={styles.iconWrapper}>
        <Ionicons name={category.icon} size={20} color="#0A7EA4" />
      </View>

      <View style={styles.details}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {transaction.concept}
        </ThemedText>
        <ThemedText style={styles.meta} numberOfLines={1}>
          {formatDateInput(transaction.date)} · {category.label}
          {wallet ? ` · ${wallet.name}` : ""}
        </ThemedText>
      </View>

      <View style={styles.amountColumn}>
        <ThemedText
          type="defaultSemiBold"
          style={[styles.amount, { color: amountColor }]}
          numberOfLines={1}
        >
          {amountPrefix}
          {formatMoney(transaction.amount, transaction.currency)}
        </ThemedText>
        <ThemedText style={styles.currency}>{transaction.currency}</ThemedText>
      </View>
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
  amountColumn: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
  currency: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
});
