import { TextInput } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { TRANSACTION_CONCEPT_MAX_LENGTH } from "../schemas/transaction.schema";
import { transactionFormStyles as styles } from "../styles/transaction-form.styles";

export interface TransactionFormConceptFieldProps {
  value: string;
  error?: string;
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

  return (
    <>
      <ThemedText style={styles.label}>Concepto</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Ej. Compra supermercado"
        placeholderTextColor={theme.muted}
        maxLength={TRANSACTION_CONCEPT_MAX_LENGTH}
        editable={!disabled}
        accessibilityLabel="Concepto"
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger : theme.border,
            color: theme.text,
          },
        ]}
      />
      {error ? (
        <ThemedText style={styles.fieldError}>{error}</ThemedText>
      ) : null}
    </>
  );
}
