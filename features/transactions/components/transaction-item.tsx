import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { formatMoney } from "@/features/wallets/utils/money";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { formatDateInput } from "@/shared/utils/date";

import {
  transactionItemPalette as palette,
  transactionItemStyles as styles,
} from "../styles/transaction-item.styles";
import { Transaction } from "../types/transaction.types";
import {
  getTransactionDetailLabel,
  OPEN_TRANSACTION_DETAIL_HINT,
} from "../utils/transaction-item-accessibility";
import { TransactionCategory } from "../utils/transaction-options";

export interface TransactionItemProps {
  transaction: Transaction;
  wallet?: Wallet;
  category: TransactionCategory;
  onPress: () => void;
}

export function TransactionItem({
  transaction,
  wallet,
  category,
  onPress,
}: TransactionItemProps) {
  const theme = useFormTheme();
  const isIncome = transaction.type === "income";
  const amountColor = isIncome ? theme.success : theme.danger;
  const amountPrefix = isIncome ? "+" : "-";
  const walletName = wallet?.name ?? transaction.walletName;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={getTransactionDetailLabel(
        transaction,
        category.label,
        walletName,
      )}
      accessibilityHint={OPEN_TRANSACTION_DETAIL_HINT}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <ThemedView
        style={[
          styles.card,
          { borderColor: theme.border, backgroundColor: theme.surface },
        ]}
      >
        <View style={styles.iconWrapper}>
          <Ionicons name={category.icon} size={20} color={palette.primary} />
        </View>

        <View style={styles.details}>
          <ThemedText type="defaultSemiBold" numberOfLines={1}>
            {transaction.concept}
          </ThemedText>
          <ThemedText style={styles.meta} numberOfLines={1}>
            {formatDateInput(transaction.date)} · {category.label}
            {walletName ? ` · ${walletName}` : ""}
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
          <ThemedText style={styles.currency}>
            {transaction.currency}
          </ThemedText>
        </View>

        <View
          style={styles.detailAffordance}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Ionicons name="chevron-forward" size={16} color={palette.primary} />
        </View>
      </ThemedView>
    </Pressable>
  );
}
