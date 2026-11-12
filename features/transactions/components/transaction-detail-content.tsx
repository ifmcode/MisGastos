import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Category } from "@/features/categories/types/category.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { asTranslate } from "@/shared/i18n/translate";

import { transactionDetailStyles as styles } from "../styles/transaction-detail.styles";
import { Transaction } from "../types/transaction.types";
import {
  buildTransactionDetailFields,
  getTransactionDetailSummary,
} from "../utils/transaction-detail";

export interface TransactionDetailContentProps {
  transaction: Transaction;
  wallets: readonly Wallet[];
  categories: readonly Category[];
}

export function TransactionDetailContent({
  transaction,
  wallets,
  categories,
}: TransactionDetailContentProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("transactions");
  const tr = asTranslate(t);
  const locale = useAppLocale();
  const summary = getTransactionDetailSummary(
    transaction,
    locale.formatCurrency,
  );
  const fields = buildTransactionDetailFields(
    transaction,
    wallets,
    categories,
    asTranslate(t),
    locale.formatDate,
  );
  const amountColor = summary.isIncome ? theme.success : theme.danger;

  return (
    <View style={styles.content}>
      <View
        style={[
          styles.summaryCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <ThemedText style={[styles.summaryType, { color: theme.muted }]}>
          {tr(summary.typeKey)}
        </ThemedText>
        <ThemedText style={[styles.summaryAmount, { color: amountColor }]}>
          {summary.isIncome ? "+" : "-"}
          {summary.amountLabel}
        </ThemedText>
        <ThemedText style={[styles.summaryCurrency, { color: theme.muted }]}>
          {summary.currency}
        </ThemedText>
      </View>

      <View
        style={[
          styles.detailsCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {fields.map((field, index) => (
          <View
            key={field.key}
            style={[
              styles.fieldRow,
              { borderBottomColor: theme.border },
              index === fields.length - 1 && styles.fieldRowLast,
            ]}
          >
            <ThemedText style={[styles.fieldLabel, { color: theme.muted }]}>
              {tr(field.labelKey)}
            </ThemedText>
            <ThemedText style={styles.fieldValue}>{field.value}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}
