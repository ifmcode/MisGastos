import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { TRANSACTION_NOTES_MAX_LENGTH } from "../schemas/transaction.schema";
import { transactionFormStyles as styles } from "../styles/transaction-form.styles";

export interface TransactionFormNotesFieldProps {
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function TransactionFormNotesField({
  value,
  error,
  disabled,
  onChange,
}: TransactionFormNotesFieldProps) {
  const theme = useFormTheme();

  return (
    <>
      <ThemedText style={styles.label}>Notas (opcional)</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Añade detalles adicionales"
        placeholderTextColor={theme.muted}
        maxLength={TRANSACTION_NOTES_MAX_LENGTH}
        editable={!disabled}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        accessibilityLabel="Notas"
        style={[
          styles.input,
          styles.textArea,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger : theme.border,
            color: theme.text,
          },
        ]}
      />
      <View style={styles.descriptionFooter}>
        {error ? (
          <ThemedText style={styles.fieldError}>{error}</ThemedText>
        ) : (
          <View />
        )}
        <ThemedText style={[styles.counter, { color: theme.muted }]}>
          {value.length}/{TRANSACTION_NOTES_MAX_LENGTH}
        </ThemedText>
      </View>
    </>
  );
}
