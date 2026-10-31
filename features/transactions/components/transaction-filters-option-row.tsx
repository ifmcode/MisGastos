import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionFiltersStyles as styles } from "../styles/transaction-filters.styles";

export interface TransactionFiltersOption<T extends string> {
  value: T;
  label: string;
}

export interface TransactionFiltersOptionRowProps<T extends string> {
  options: ReadonlyArray<TransactionFiltersOption<T>>;
  selectedValue: T;
  onSelect: (value: T) => void;
}

export function TransactionFiltersOptionRow<T extends string>({
  options,
  selectedValue,
  onSelect,
}: TransactionFiltersOptionRowProps<T>) {
  const theme = useFormTheme();

  return (
    <View style={styles.typeRow}>
      {options.map((option) => {
        const selected = selectedValue === option.value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onSelect(option.value)}
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
