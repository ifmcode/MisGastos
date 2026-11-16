import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { sharedExpensesStyles as styles } from "../styles/shared-expenses.styles";

export interface SharedExpensesSectionHeaderProps {
  /** True while the viewer has no accepted friend. */
  disabled: boolean;
  onAdd: () => void;
}

/** Section title plus the add action, disabled without accepted friends. */
export function SharedExpensesSectionHeader({
  disabled,
  onAdd,
}: SharedExpensesSectionHeaderProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("sharedExpenses");

  return (
    <View>
      <View style={styles.headerRow}>
        <ThemedText
          accessibilityRole="header"
          style={[styles.sectionTitle, { color: theme.muted }]}
        >
          {t("title")}
        </ThemedText>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("addAccessibility")}
          accessibilityHint={disabled ? t("addDisabledHelper") : t("addHint")}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={onAdd}
          style={({ pressed }) => [
            styles.addButton,
            {
              borderColor: theme.primary,
              backgroundColor: theme.primarySoft,
            },
            disabled && styles.addButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="add"
            size={18}
            color={theme.primary}
            accessible={false}
          />
          <ThemedText style={[styles.addButtonText, { color: theme.primary }]}>
            {t("add")}
          </ThemedText>
        </Pressable>
      </View>

      {disabled ? (
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {t("addDisabledHelper")}
        </ThemedText>
      ) : null}
    </View>
  );
}
