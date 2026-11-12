import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { asTranslate } from "@/shared/i18n/translate";

import { transactionFiltersStyles as styles } from "../styles/transaction-filters.styles";
import { TransactionFiltersOption } from "../utils/transaction-filters-options";

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
  const { t } = useTranslation("transactions");
  const tr = asTranslate(t);

  return (
    <View style={styles.chipsWrap}>
      {options.map((option) => {
        const selected = selectedValue === option.value;
        const label = option.labelKey ? tr(option.labelKey) : option.label ?? "";

        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
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
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
