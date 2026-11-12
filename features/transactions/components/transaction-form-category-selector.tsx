import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { asTranslate } from "@/shared/i18n/translate";

import { transactionFormStyles as styles } from "../styles/transaction-form.styles";
import { getTransactionCategoryChips } from "../utils/transaction-category-chips";
import {
  getTransactionCategoryLabel,
  TransactionCategory,
} from "../utils/transaction-options";

export interface TransactionFormCategorySelectorProps {
  categories: readonly TransactionCategory[];
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (categoryId: string) => void;
  onOpenPicker: () => void;
}

/**
 * Compact category picker: up to three chips plus a `+` chip that opens the
 * full category popup. The selected category is always one of the chips.
 */
export function TransactionFormCategorySelector({
  categories,
  value,
  error,
  disabled,
  onChange,
  onOpenPicker,
}: TransactionFormCategorySelectorProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("transactions");
  const { visible } = getTransactionCategoryChips(categories, value);

  return (
    <View>
      <ThemedText style={styles.label}>{t("form.category")}</ThemedText>
      <View style={styles.categoryChips}>
        {visible.map((category) => {
          const selected = value === category.id;
          const label = getTransactionCategoryLabel(category, asTranslate(t));

          return (
            <Pressable
              key={category.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={label}
              onPress={() => onChange(category.id)}
              disabled={disabled}
              style={[
                styles.categoryItem,
                {
                  backgroundColor: selected
                    ? theme.primarySoft
                    : theme.surface,
                  borderColor: selected ? theme.primary : theme.border,
                },
              ]}
            >
              <Ionicons
                name={category.icon}
                size={20}
                color={selected ? theme.primary : theme.muted}
              />
              <ThemedText
                style={[
                  styles.categoryText,
                  { color: selected ? theme.primary : theme.text },
                ]}
                numberOfLines={1}
              >
                {label}
              </ThemedText>
            </Pressable>
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("form.selectCategory")}
          accessibilityHint={t("form.selectCategoryHint")}
          onPress={onOpenPicker}
          disabled={disabled}
          style={[
            styles.categoryItem,
            styles.categoryAddItem,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="add" size={20} color={theme.primary} />
        </Pressable>
      </View>
      {categories.length === 0 ? (
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {t("form.noCategories")}
        </ThemedText>
      ) : null}
      {error ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}
