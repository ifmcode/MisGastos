import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { TRANSFER_NOTES_MAX_LENGTH } from "../schemas/transfer.schema";
import { transferFormStyles as styles } from "../styles/transfer-form.styles";

export interface TransferFormNotesFieldProps {
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function TransferFormNotesField({
  value,
  error,
  disabled,
  onChange,
}: TransferFormNotesFieldProps) {
  const theme = useFormTheme();

  return (
    <>
      <ThemedText style={styles.label}>Notas (opcional)</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Ej. Traspaso al fondo de ahorro"
        placeholderTextColor={theme.muted}
        maxLength={TRANSFER_NOTES_MAX_LENGTH}
        editable={!disabled}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        accessibilityLabel="Notas de la transferencia"
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
          {value.length}/{TRANSFER_NOTES_MAX_LENGTH}
        </ThemedText>
      </View>
    </>
  );
}
