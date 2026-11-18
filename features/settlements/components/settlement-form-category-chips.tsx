import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { SettlementValidationCode } from "../schemas/settlement-validation.types";
import { settlementsStyles as styles } from "../styles/settlements.styles";
import type { SettlementIncomeCategory } from "../utils/settlement-form-options";

export interface SettlementFormCategoryChipsProps {
  options: readonly SettlementIncomeCategory[];
  selectedId: string;
  disabled: boolean;
  error?: SettlementValidationCode;
  onChange: (categoryId: string) => void;
}

/** Income categories of the linked movement, shown once a wallet is chosen. */
export function SettlementFormCategoryChips({
  options,
  selectedId,
  disabled,
  error,
  onChange,
}: SettlementFormCategoryChipsProps) {
  const theme = useFormTheme();
  const { t, tr } = useScopedTranslation("settlements");

  return (
    <View>
      <ThemedText style={styles.label}>{t("form.categoryLabel")}</ThemedText>
      <View
        style={styles.chipRow}
        accessibilityRole="radiogroup"
        accessibilityLabel={t("form.categoryGroupAccessibility")}
      >
        {options.map((option) => {
          const selected = selectedId === option.id;
          const label = option.unavailable
            ? t("form.categoryUnavailable")
            : option.name;

          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={t("form.categoryChipAccessibility", {
                name: label,
              })}
              disabled={disabled}
              onPress={() => onChange(option.id)}
              style={({ pressed }) => [
                styles.optionChip,
                {
                  backgroundColor: selected ? theme.primarySoft : theme.surface,
                  borderColor: selected ? theme.primary : theme.border,
                },
                disabled && styles.optionChipDisabled,
                pressed && styles.pressed,
              ]}
            >
              <ThemedText
                style={[
                  styles.optionChipText,
                  { color: selected ? theme.primary : theme.text },
                ]}
              >
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      <ThemedText style={[styles.helper, { color: theme.muted }]}>
        {t("form.categoryHint")}
      </ThemedText>
      {error ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {tr(`errors.${error}`)}
        </ThemedText>
      ) : null}
    </View>
  );
}
