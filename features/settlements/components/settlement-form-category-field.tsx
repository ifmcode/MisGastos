import { useState } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { CategorySelectButton } from "@/shared/components/molecules/category-select-button";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { SettlementValidationCode } from "../schemas/settlement-validation.types";
import { settlementsStyles as styles } from "../styles/settlements.styles";
import {
  findSettlementIncomeCategoryOption,
  type SettlementIncomeCategory,
} from "../utils/settlement-form-options";
import { SettlementCategoryPickerDialog } from "./settlement-category-picker-dialog";

export interface SettlementFormCategoryFieldProps {
  options: readonly SettlementIncomeCategory[];
  selectedId: string;
  disabled: boolean;
  error?: SettlementValidationCode;
  onChange: (categoryId: string) => void;
}

/**
 * Income category of the linked movement, shown once a wallet is chosen. The
 * trigger opens the full popup, so a growing category list never widens the
 * form.
 */
export function SettlementFormCategoryField({
  options,
  selectedId,
  disabled,
  error,
  onChange,
}: SettlementFormCategoryFieldProps) {
  const theme = useFormTheme();
  const { t, tr } = useScopedTranslation("settlements");
  const [pickerVisible, setPickerVisible] = useState(false);
  const selected = findSettlementIncomeCategoryOption(options, selectedId);
  const selectedLabel = selected
    ? selected.unavailable
      ? t("form.categoryUnavailable")
      : selected.name
    : null;
  const label = selectedLabel ?? t("form.categorySelect");
  const accessibilityLabel = selectedLabel
    ? t("form.categorySelectedAccessibility", { name: selectedLabel })
    : t("form.categorySelect");

  function select(categoryId: string) {
    onChange(categoryId);
    setPickerVisible(false);
  }

  return (
    <View>
      <ThemedText style={styles.label}>{t("form.categoryLabel")}</ThemedText>

      <CategorySelectButton
        icon={selected ? selected.icon : null}
        label={label}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={t("form.categoryHint")}
        disabled={disabled}
        hasError={Boolean(error)}
        onPress={() => setPickerVisible(true)}
      />

      <ThemedText style={[styles.helper, { color: theme.muted }]}>
        {t("form.categoryHint")}
      </ThemedText>

      {error ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {tr(`errors.${error}`)}
        </ThemedText>
      ) : null}

      <SettlementCategoryPickerDialog
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
