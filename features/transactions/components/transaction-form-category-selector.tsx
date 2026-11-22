import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { CategorySelectButton } from "@/shared/components/molecules/category-select-button";
import { formFieldStyles } from "@/shared/components/molecules/form-field.styles";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { asTranslate } from "@/shared/i18n/translate";

import type { TransactionValidationCode } from "../schemas/transaction-validation.types";
import { getTransactionFieldErrorText } from "../utils/transaction-field-error";
import {
  findTransactionCategoryOption,
  getTransactionCategoryLabel,
  type TransactionCategory,
} from "../utils/transaction-options";

export interface TransactionFormCategorySelectorProps {
  categories: readonly TransactionCategory[];
  value: string;
  error?: TransactionValidationCode;
  disabled: boolean;
  onOpenPicker: () => void;
}

/**
 * Single category trigger of the movement form: the chosen category once there
 * is one, otherwise the translated empty-state label. It only opens the popup.
 */
export function TransactionFormCategorySelector({
  categories,
  value,
  error,
  disabled,
  onOpenPicker,
}: TransactionFormCategorySelectorProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["transactions", "validation"]);
  const translate = asTranslate(t);
  const selected = findTransactionCategoryOption(categories, value);
  const label = selected
    ? getTransactionCategoryLabel(selected, translate)
    : t("form.selectCategory");
  const accessibilityLabel = selected
    ? t("form.selectedCategoryAccessibility", { name: label })
    : t("form.selectCategory");
  const errorText = error ? getTransactionFieldErrorText(error, translate) : null;

  return (
    <View>
      <ThemedText style={formFieldStyles.label}>{t("form.category")}</ThemedText>

      <CategorySelectButton
        icon={selected ? selected.icon : null}
        label={label}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={t("form.selectCategoryHint")}
        disabled={disabled}
        hasError={Boolean(error)}
        iconColor={selected?.color}
        onPress={onOpenPicker}
      />

      {categories.length === 0 ? (
        <ThemedText style={[formFieldStyles.helper, { color: theme.muted }]}>
          {t("form.noCategories")}
        </ThemedText>
      ) : null}

      {errorText ? (
        <ThemedText
          style={[formFieldStyles.fieldError, { color: theme.danger }]}
        >
          {errorText}
        </ThemedText>
      ) : null}
    </View>
  );
}
