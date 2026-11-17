import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { linkedMovementStyles as styles } from "../styles/shared-expense-linked-movement.styles";
import { sharedExpensesStyles } from "../styles/shared-expenses.styles";
import {
  getSharedExpenseCategoryChips,
  getSharedExpenseCategoryLabel,
  type SharedExpenseCategoryOption,
} from "../utils/shared-expense-link-options";
import { SharedExpenseCategoryPickerDialog } from "./shared-expense-category-picker-dialog";

export interface SharedExpenseCategoryFieldProps {
  options: readonly SharedExpenseCategoryOption[];
  selectedId: string;
  disabled: boolean;
  /** Translated category error, already resolved from its validation code. */
  errorText?: string | null;
  onChange: (categoryId: string) => void;
}

/** Linked-movement category: compact chips plus the full-list popup. */
export function SharedExpenseCategoryField({
  options,
  selectedId,
  disabled,
  errorText,
  onChange,
}: SharedExpenseCategoryFieldProps) {
  const theme = useFormTheme();
  const { t, tr } = useScopedTranslation("sharedExpenses");
  const [pickerVisible, setPickerVisible] = useState(false);
  const chips = getSharedExpenseCategoryChips(options, selectedId);

  function select(categoryId: string) {
    onChange(categoryId);
    setPickerVisible(false);
  }

  return (
    <View>
      <ThemedText style={sharedExpensesStyles.label}>
        {t("form.categoryLabel")}
      </ThemedText>
      <View
        style={styles.chipRow}
        accessibilityRole="radiogroup"
        accessibilityLabel={t("form.categoryGroupAccessibility")}
      >
        {chips.map((option) => {
          const selected = selectedId === option.id;
          const label = getSharedExpenseCategoryLabel(option, tr);

          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={t("form.categoryChipAccessibility", {
                name: label,
              })}
              accessibilityHint={t("form.categoryHint")}
              onPress={() => onChange(option.id)}
              disabled={disabled}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: selected ? theme.primarySoft : theme.surface,
                  borderColor: selected ? theme.primary : theme.border,
                },
                pressed && styles.pickerOptionPressed,
              ]}
            >
              <Ionicons
                name={option.icon}
                size={18}
                color={selected ? theme.primary : theme.muted}
                accessible={false}
              />
              <ThemedText
                style={[
                  styles.chipText,
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
          accessibilityLabel={t("form.categoryPickerOpenAccessibility")}
          accessibilityHint={t("form.categoryHint")}
          onPress={() => setPickerVisible(true)}
          disabled={disabled}
          style={({ pressed }) => [
            styles.chip,
            styles.chipAdd,
            { backgroundColor: theme.surface, borderColor: theme.border },
            pressed && styles.pickerOptionPressed,
          ]}
        >
          <Ionicons
            name="add"
            size={20}
            color={theme.primary}
            accessible={false}
          />
        </Pressable>
      </View>

      {errorText ? (
        <ThemedText
          style={[sharedExpensesStyles.fieldError, { color: theme.danger }]}
        >
          {errorText}
        </ThemedText>
      ) : null}

      <SharedExpenseCategoryPickerDialog
        visible={pickerVisible}
        options={options}
        selectedId={selectedId}
        disabled={disabled}
        onSelect={select}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}
