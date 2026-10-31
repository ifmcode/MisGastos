import { TextInput } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transferFormStyles as styles } from "../styles/transfer-form.styles";

export interface TransferFormDateFieldProps {
  text: string;
  error?: string;
  disabled: boolean;
  onChange: (text: string) => void;
}

export function TransferFormDateField({
  text,
  error,
  disabled,
  onChange,
}: TransferFormDateFieldProps) {
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
        accessibilityLabel="Fecha de la transferencia"
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
