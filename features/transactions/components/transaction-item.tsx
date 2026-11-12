import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { asTranslate } from "@/shared/i18n/translate";

import {
  transactionItemPalette as palette,
  transactionItemStyles as styles,
} from "../styles/transaction-item.styles";
import { Transaction } from "../types/transaction.types";
import {
  getTransactionDetailLabel,
  OPEN_TRANSACTION_DETAIL_HINT_KEY,
} from "../utils/transaction-item-accessibility";
import {
  getTransactionCategoryLabel,
  TransactionCategory,
} from "../utils/transaction-options";

export interface TransactionItemProps {
  transaction: Transaction;
  wallet?: Wallet;
  category: TransactionCategory;
  /** Overrides the default detail-view hint when the row opens another screen. */
  accessibilityHint?: string;
  onPress: () => void;
}

export function TransactionItem({
  transaction,
  wallet,
  category,
  accessibilityHint,
  onPress,
}: TransactionItemProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("transactions");
  const tr = asTranslate(t);
  const locale = useAppLocale();
  const isIncome = transaction.type === "income";
  const amountColor = isIncome ? theme.success : theme.danger;
  const amountPrefix = isIncome ? "+" : "-";
  const walletName = wallet?.name ?? transaction.walletName;
  const categoryLabel = getTransactionCategoryLabel(category, tr);
  const amount = locale.formatCurrency(
    transaction.amount,
    transaction.currency,
  );
  const date = locale.formatDate(transaction.date);
  const detailLabel = getTransactionDetailLabel(
    transaction,
    categoryLabel,
    amount,
    date,
    walletName,
  );
  const hint = accessibilityHint ?? t(OPEN_TRANSACTION_DETAIL_HINT_KEY);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tr(detailLabel.key, {
        ...detailLabel.values,
        type: tr(detailLabel.values.typeKey),
      })}
      accessibilityHint={hint}
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
            {date} · {categoryLabel}
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
            {amount}
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
