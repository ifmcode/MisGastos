import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import {
  type TransactionValidationCode,
} from "../schemas/transaction.schema";
import { transactionFormStyles as styles } from "../styles/transaction-form.styles";

export interface TransactionFormAmountFieldProps {
  value: string;
  symbol: string;
  error?: TransactionValidationCode;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function TransactionFormAmountField({
  value,
  symbol,
  error,
  disabled,
  onChange,
}: TransactionFormAmountFieldProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["transactions", "validation"]);
  const errorText = error ? t(`validation:transactions.${error}`) : null;

  return (
    <View>
      <ThemedText style={styles.label}>{t("form.amount")}</ThemedText>
      <View
        style={[
          styles.amountWrapper,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger : theme.border,
          },
        ]}
      >
        <ThemedText style={[styles.amountSymbol, { color: theme.muted }]}>
          {symbol}
        </ThemedText>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={t("form.amountPlaceholder")}
          placeholderTextColor={theme.muted}
          keyboardType="decimal-pad"
          inputMode="decimal"
          editable={!disabled}
          accessibilityLabel={t("form.amountAccessibility")}
          style={[styles.amountInput, { color: theme.text }]}
        />
      </View>
      {errorText ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {errorText}
        </ThemedText>
      ) : null}
    </View>
  );
}
