import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, View } from "react-native";

import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { sharedExpensesStyles as styles } from "../styles/shared-expenses.styles";

export interface SharedExpenseRowActionsProps {
  description: string;
  /** True while any row of the list has an operation in flight. */
  disabled: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

/** Pencil and trash actions of one expense row. */
export function SharedExpenseRowActions({
  description,
  disabled,
  deleting,
  onEdit,
  onDelete,
}: SharedExpenseRowActionsProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("sharedExpenses");

  return (
    <View style={styles.rowActions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("row.editAccessibility", { description })}
        accessibilityHint={t("row.editHint")}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onEdit}
        style={({ pressed }) => [
          styles.iconButton,
          { backgroundColor: theme.primarySoft },
          disabled && styles.actionDisabled,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name="pencil-outline"
          size={20}
          color={theme.primary}
          accessible={false}
        />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("row.deleteAccessibility", { description })}
        accessibilityHint={
          deleting ? t("row.deletingHint") : t("row.deleteHint")
        }
        accessibilityState={{ disabled, busy: deleting }}
        disabled={disabled}
        onPress={onDelete}
        style={({ pressed }) => [
          styles.iconButton,
          { backgroundColor: theme.dangerSurface },
          disabled && styles.actionDisabled,
          pressed && styles.pressed,
        ]}
      >
        {deleting ? (
          <ActivityIndicator size="small" color={theme.danger} />
        ) : (
          <Ionicons
            name="trash-outline"
            size={20}
            color={theme.danger}
            accessible={false}
          />
        )}
      </Pressable>
    </View>
  );
}
