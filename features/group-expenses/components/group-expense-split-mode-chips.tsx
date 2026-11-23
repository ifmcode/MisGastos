import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { ExpenseSplitMode } from "@/features/group-expenses/types/group-expense.types";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupExpensesStyles as styles } from "../styles/group-expenses.styles";
import { getVisibleGroupSplitModes } from "../utils/group-expense-split-modes";

const MODE_LABEL_KEYS: Record<ExpenseSplitMode, string> = {
  equal: "form.splitEqual",
  percentage: "form.splitPercentage",
  fixed: "form.splitFixed",
  shares: "form.splitShares",
};

export interface GroupExpenseSplitModeChipsProps {
  mode: ExpenseSplitMode;
  disabled: boolean;
  onModeChange: (mode: ExpenseSplitMode) => void;
}

/** The split-mode chips, one selected radio at a time. */
export function GroupExpenseSplitModeChips({
  mode,
  disabled,
  onModeChange,
}: GroupExpenseSplitModeChipsProps) {
  const theme = useFormTheme();
  const { t, tr } = useScopedTranslation("groupExpenses");
  const modes = getVisibleGroupSplitModes(mode);

  return (
    <View style={styles.chipRow}>
      {modes.map((option) => {
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
