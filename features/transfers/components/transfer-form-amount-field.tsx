import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { type TransferValidationCode } from "../schemas/transfer.schema";
import { transferFormStyles as styles } from "../styles/transfer-form.styles";

export interface TransferFormAmountFieldProps {
  value: string;
  symbol: string;
  error?: TransferValidationCode;
  helper?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function TransferFormAmountField({
  value,
  symbol,
  error,
  helper,
  disabled,
  onChange,
}: TransferFormAmountFieldProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["transfers", "validation"]);
  const errorText = error ? t(`validation:transfers.${error}`) : null;

  return (
    <>
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
      ) : helper ? (
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {helper}
        </ThemedText>
      ) : null}
    </>
  );
}
