import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { sharedExpensesStyles as styles } from "../styles/shared-expenses.styles";
import type { ExpenseSplitMode } from "../types/shared-expense.types";

const MODE_LABEL_KEYS: Record<ExpenseSplitMode, string> = {
  equal: "form.splitEqual",
  percentage: "form.splitPercentage",
  fixed: "form.splitFixed",
  shares: "form.splitShares",
};

/**
 * Modes offered in the 1:1 form. `percentage` and `shares` are still valid in
 * the domain and stay in `EXPENSE_SPLIT_MODES` so a legacy stored expense keeps
 * rendering; they are just not selectable here.
 */
const VISIBLE_SPLIT_MODES: readonly ExpenseSplitMode[] = ["equal", "fixed"];

export interface SharedExpenseSplitModeChipsProps {
  mode: ExpenseSplitMode;
  disabled: boolean;
  onModeChange: (mode: ExpenseSplitMode) => void;
}

/** The split-mode chips, one selected radio at a time. */
export function SharedExpenseSplitModeChips({
  mode,
  disabled,
  onModeChange,
}: SharedExpenseSplitModeChipsProps) {
  const theme = useFormTheme();
  const { t, tr } = useScopedTranslation("sharedExpenses");

  return (
    <View style={styles.chipRow}>
      {VISIBLE_SPLIT_MODES.map((option) => {
        const selected = mode === option;
        const label = tr(MODE_LABEL_KEYS[option]);

        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={t("form.splitModeAccessibility", { label })}
            disabled={disabled}
            onPress={() => onModeChange(option)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: selected ? theme.primary : theme.surface,
                borderColor: selected ? theme.primary : theme.border,
              },
              pressed && styles.pressed,
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
