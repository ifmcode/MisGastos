import { useState } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { CategorySelectButton } from "@/shared/components/molecules/category-select-button";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { sharedExpensesStyles } from "../styles/shared-expenses.styles";
import type { SharedExpenseLinkScope } from "../types/shared-expense-link.types";
import {
  findSharedExpenseCategoryOption,
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
  /** Copy namespace; the 1:1 form is the default, groups pass their own. */
  scope?: SharedExpenseLinkScope;
  onChange: (categoryId: string) => void;
}

/** Linked-movement category trigger plus its full-list popup; both forms. */
export function SharedExpenseCategoryField({
  options,
  selectedId,
  disabled,
  errorText,
  scope = "sharedExpenses",
  onChange,
}: SharedExpenseCategoryFieldProps) {
  const theme = useFormTheme();
  const { t, tr } = useScopedTranslation(scope);
  const [pickerVisible, setPickerVisible] = useState(false);
  const selected = findSharedExpenseCategoryOption(options, selectedId);
  const label = selected
    ? getSharedExpenseCategoryLabel(selected, tr)
    : t("form.categorySelect");
  const accessibilityLabel = selected
    ? t("form.categorySelectedAccessibility", { name: label })
    : t("form.categorySelect");

  function select(categoryId: string) {
    onChange(categoryId);
    setPickerVisible(false);
  }

  return (
    <View>
      <ThemedText style={sharedExpensesStyles.label}>
        {t("form.categoryLabel")}
      </ThemedText>

      <CategorySelectButton
        icon={selected ? selected.icon : null}
        label={label}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={t("form.categoryHint")}
        disabled={disabled}
        hasError={Boolean(errorText)}
        onPress={() => setPickerVisible(true)}
      />

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
        scope={scope}
        onSelect={select}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}
