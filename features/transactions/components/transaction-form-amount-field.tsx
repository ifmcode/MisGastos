import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionFormStyles as styles } from "../styles/transaction-form.styles";

export interface TransactionFormAmountFieldProps {
  value: string;
  symbol: string;
  error?: string;
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

  return (
    <View>
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
          accessibilityLabel="Importe"
          style={[styles.amountInput, { color: theme.text }]}
        />
      </View>
      {error ? (
        <ThemedText style={styles.fieldError}>{error}</ThemedText>
      ) : null}
    </View>
  );
}
