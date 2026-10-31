import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { WALLET_DESCRIPTION_MAX_LENGTH } from "../schemas/wallet.schema";
import { walletFormStyles as styles } from "../styles/wallet-form.styles";

export interface WalletFormDescriptionFieldProps {
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function WalletFormDescriptionField({
  value,
  error,
  disabled,
  onChange,
}: WalletFormDescriptionFieldProps) {
  const theme = useFormTheme();

  return (
    <View>
      <ThemedText style={styles.label}>Descripción (opcional)</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Ej. Cuenta para gastos del día a día"
        placeholderTextColor={theme.muted}
        maxLength={WALLET_DESCRIPTION_MAX_LENGTH}
        editable={!disabled}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        accessibilityLabel="Descripción de la cartera"
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
          {value.length}/{WALLET_DESCRIPTION_MAX_LENGTH}
        </ThemedText>
      </View>
    </View>
  );
}
