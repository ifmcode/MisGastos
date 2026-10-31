import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionFormStyles as styles } from "../styles/transaction-form.styles";
import { TransactionType } from "../types/transaction.types";
import { TRANSACTION_TYPE_OPTIONS } from "../utils/transaction-options";

export interface TransactionFormTypeSelectorProps {
  value: TransactionType;
  disabled: boolean;
  onChange: (type: TransactionType) => void;
}

export function TransactionFormTypeSelector({
  value,
  disabled,
  onChange,
}: TransactionFormTypeSelectorProps) {
  const theme = useFormTheme();

  return (
    <View style={styles.typeRow}>
      {TRANSACTION_TYPE_OPTIONS.map((option) => {
        const selected = value === option.value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            disabled={disabled}
            style={[
              styles.typeButton,
              {
                backgroundColor: selected ? theme.primary : theme.surface,
                borderColor: selected ? theme.primary : theme.border,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.typeButtonText,
                { color: selected ? theme.onPrimary : theme.text },
              ]}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
