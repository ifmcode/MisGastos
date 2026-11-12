import { useTranslation } from "react-i18next";
import { TextInput } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import {
  TRANSACTION_CONCEPT_MAX_LENGTH,
  type TransactionValidationCode,
} from "../schemas/transaction.schema";
import { transactionFormStyles as styles } from "../styles/transaction-form.styles";

export interface TransactionFormConceptFieldProps {
  value: string;
  error?: TransactionValidationCode;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function TransactionFormConceptField({
  value,
  error,
  disabled,
  onChange,
}: TransactionFormConceptFieldProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["transactions", "validation"]);
  const errorText = error
    ? t(`validation:transactions.${error}`, {
        max: TRANSACTION_CONCEPT_MAX_LENGTH,
      })
    : null;

  return (
    <>
      <ThemedText style={styles.label}>{t("form.concept")}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t("form.conceptPlaceholder")}
        placeholderTextColor={theme.muted}
        maxLength={TRANSACTION_CONCEPT_MAX_LENGTH}
        editable={!disabled}
        accessibilityLabel={t("form.conceptAccessibility")}
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger : theme.border,
            color: theme.text,
          },
        ]}
      />
      {errorText ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {errorText}
        </ThemedText>
      ) : null}
    </>
  );
}
