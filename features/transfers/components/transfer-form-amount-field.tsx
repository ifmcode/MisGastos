import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transferFormStyles as styles } from "../styles/transfer-form.styles";

export interface TransferFormAmountFieldProps {
  value: string;
  symbol: string;
  error?: string;
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

  return (
    <>
      <ThemedText style={styles.label}>Importe</ThemedText>
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
          placeholder="0,00"
          placeholderTextColor={theme.muted}
          keyboardType="decimal-pad"
          inputMode="decimal"
          editable={!disabled}
          accessibilityLabel="Importe de la transferencia"
          style={[styles.amountInput, { color: theme.text }]}
        />
      </View>
      {error ? (
        <ThemedText style={styles.fieldError}>{error}</ThemedText>
      ) : helper ? (
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {helper}
        </ThemedText>
      ) : null}
    </>
  );
}
