import { useState } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  findSettlementIncomeCategoryOption,
  type SettlementIncomeCategory,
} from "@/features/settlements/utils/settlement-form-options";
import { CategorySelectButton } from "@/shared/components/molecules/category-select-button";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { GroupSettlementValidationCode } from "../schemas/group-settlement.schema";
import { groupExpensesStyles as styles } from "../styles/group-expenses.styles";
import { GroupSettlementCategoryPickerDialog } from "./group-settlement-category-picker-dialog";

export interface GroupSettlementCategoryFieldProps {
  options: readonly SettlementIncomeCategory[];
  selectedId: string;
  disabled: boolean;
  error?: GroupSettlementValidationCode;
  onChange: (categoryId: string) => void;
}

/** Income category of the creditor's linked movement, once a wallet is chosen. */
export function GroupSettlementCategoryField({
  options,
  selectedId,
  disabled,
  error,
  onChange,
}: GroupSettlementCategoryFieldProps) {
  const theme = useFormTheme();
  const { t, tr } = useScopedTranslation("groupExpenses");
  const [pickerVisible, setPickerVisible] = useState(false);
  const selected = findSettlementIncomeCategoryOption(options, selectedId);
  const selectedLabel = selected
    ? selected.unavailable
      ? t("settlementForm.categoryUnavailable")
      : selected.name
    : null;
  const label = selectedLabel ?? t("settlementForm.categorySelect");
  const accessibilityLabel = selectedLabel
    ? t("settlementForm.categorySelectedAccessibility", {
        name: selectedLabel,
      })
    : t("settlementForm.categorySelect");

  function select(categoryId: string) {
    onChange(categoryId);
    setPickerVisible(false);
  }

  return (
    <View>
      <ThemedText style={styles.label}>
        {t("settlementForm.categoryLabel")}
      </ThemedText>

      <CategorySelectButton
        icon={selected ? selected.icon : null}
        label={label}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={t("settlementForm.categoryHint")}
        disabled={disabled}
        hasError={Boolean(error)}
        onPress={() => setPickerVisible(true)}
      />

      <ThemedText style={[styles.helper, { color: theme.muted }]}>
        {t("settlementForm.categoryHint")}
      </ThemedText>

      {error ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {tr(`errors.${error}`)}
        </ThemedText>
      ) : null}

      <GroupSettlementCategoryPickerDialog
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
