import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { formFieldStyles as styles } from "./form-field.styles";

export interface AmountFieldProps {
  /** Already translated copy. */
  label: string;
  value: string;
  symbol: string;
  placeholder: string;
  accessibilityLabel: string;
  errorText?: string | null;
  helperText?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

/** Amount input with a currency symbol and optional error/helper text. */
export function AmountField({
  label,
  value,
  symbol,
  placeholder,
  accessibilityLabel,
  errorText,
  helperText,
  disabled,
  onChange,
}: AmountFieldProps) {
  const theme = useFormTheme();

  return (
    <View>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View
        style={[
          styles.amountWrapper,
          {
            backgroundColor: theme.surface,
            borderColor: errorText ? theme.danger : theme.border,
          },
        ]}
      >
        <ThemedText style={[styles.amountSymbol, { color: theme.muted }]}>
          {symbol}
        </ThemedText>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          keyboardType="decimal-pad"
          inputMode="decimal"
          editable={!disabled}
          accessibilityLabel={accessibilityLabel}
          style={[styles.amountInput, { color: theme.text }]}
        />
      </View>
      {errorText ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {errorText}
        </ThemedText>
      ) : helperText ? (
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {helperText}
        </ThemedText>
      ) : null}
    </View>
  );
}
