import { TextInput } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionFormStyles as styles } from "../styles/transaction-form.styles";

export interface TransactionFormDateFieldProps {
  text: string;
  error?: string;
  disabled: boolean;
  onChange: (text: string) => void;
}

export function TransactionFormDateField({
  text,
  error,
  disabled,
  onChange,
}: TransactionFormDateFieldProps) {
  const theme = useFormTheme();

  return (
    <>
      <ThemedText style={styles.label}>Fecha</ThemedText>
      <TextInput
        value={text}
        onChangeText={onChange}
        placeholder="DD/MM/AAAA"
        placeholderTextColor={theme.muted}
        editable={!disabled}
        accessibilityLabel="Fecha"
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
      ) : (
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          Por defecto se usa hoy.
        </ThemedText>
      )}
    </>
  );
}
