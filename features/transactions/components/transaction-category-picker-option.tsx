import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { asTranslate } from "@/shared/i18n/translate";

import { transactionFormStyles as styles } from "../styles/transaction-form.styles";
import {
  getTransactionCategoryLabel,
  TransactionCategory,
} from "../utils/transaction-options";

export interface TransactionCategoryPickerOptionProps {
  category: TransactionCategory;
  selected: boolean;
  disabled: boolean;
  onSelect: (categoryId: string) => void;
}

/** One selectable row inside the full-category popup. */
export function TransactionCategoryPickerOption({
  category,
  selected,
  disabled,
  onSelect,
}: TransactionCategoryPickerOptionProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("transactions");
  const label = getTransactionCategoryLabel(category, asTranslate(t));

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={() => onSelect(category.id)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pickerOption,
        {
          backgroundColor: selected ? theme.primarySoft : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
        },
        pressed && styles.pickerOptionPressed,
      ]}
    >
      <Ionicons
        name={category.icon}
        size={20}
        color={selected ? theme.primary : theme.muted}
      />
      <ThemedText
        style={[
          styles.pickerOptionText,
          { color: selected ? theme.primary : theme.text },
        ]}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
      {selected ? (
        <Ionicons name="checkmark" size={18} color={theme.primary} />
      ) : null}
    </Pressable>
  );
}
