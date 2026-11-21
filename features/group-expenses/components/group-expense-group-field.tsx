import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupExpensesStyles as styles } from "../styles/group-expenses.styles";

export interface GroupExpenseGroupFieldProps {
  /** Group name; empty while a movements create has not picked one yet. */
  groupName: string;
  /** Editing or opened from the group detail: the group cannot change. */
  locked: boolean;
  disabled: boolean;
  errorText: string | null;
  onOpenPicker: () => void;
}

/** Compact group row: locked with its hint, or the entry point of the picker. */
export function GroupExpenseGroupField({
  groupName,
  locked,
  disabled,
  errorText,
  onOpenPicker,
}: GroupExpenseGroupFieldProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groupExpenses");
  const hint = locked ? t("form.groupLockedHint") : t("form.groupHint");

  return (
    <View>
      <ThemedText style={styles.label}>{t("form.groupLabel")}</ThemedText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          groupName
            ? t("form.groupSelectedAccessibility", { name: groupName })
            : t("form.groupAccessibility")
        }
        accessibilityHint={hint}
        accessibilityState={{ disabled: locked || disabled }}
        disabled={locked || disabled}
        onPress={onOpenPicker}
        style={({ pressed }) => [
          styles.groupField,
          {
            borderColor: errorText ? theme.danger : theme.border,
            backgroundColor: theme.surface,
          },
          (locked || disabled) && styles.actionDisabled,
          pressed && styles.pressed,
        ]}
      >
        <ThemedText
          style={[
            styles.groupFieldText,
            { color: groupName ? theme.text : theme.muted },
          ]}
          numberOfLines={1}
        >
          {groupName || t("form.groupPlaceholder")}
        </ThemedText>
        <Ionicons
          name={locked ? "lock-closed-outline" : "chevron-down"}
          size={18}
          color={theme.muted}
          accessible={false}
        />
      </Pressable>

      <ThemedText style={[styles.helper, { color: theme.muted }]}>
        {hint}
      </ThemedText>

      {errorText ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {errorText}
        </ThemedText>
      ) : null}
    </View>
  );
}
