import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionFiltersStyles as styles } from "../styles/transaction-filters.styles";
import { TransactionFiltersOption } from "./transaction-filters-option-row";

export interface TransactionFiltersChipGroupProps<T extends string> {
  options: ReadonlyArray<TransactionFiltersOption<T>>;
  selectedValue: T;
  onSelect: (value: T) => void;
}

export function TransactionFiltersChipGroup<T extends string>({
  options,
  selectedValue,
  onSelect,
}: TransactionFiltersChipGroupProps<T>) {
  const theme = useFormTheme();

  return (
    <View style={styles.chipsWrap}>
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
              styles.chip,
              {
                backgroundColor: selected ? theme.primary : theme.surface,
                borderColor: selected ? theme.primary : theme.border,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.chipText,
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
