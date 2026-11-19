import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { sharedExpensesStyles as styles } from "../styles/shared-expenses.styles";

export interface SharedExpenseFormNoticeProps {
  /** Already translated: a service error or the highlighted-fields summary. */
  text: string;
  tone: "error" | "notice";
}

/**
 * Bottom notice of the form. A server error is an error (red); the field
 * summary is only a notice (amber), because each field already shows its text.
 */
export function SharedExpenseFormNotice({
  text,
  tone,
}: SharedExpenseFormNoticeProps) {
  const theme = useFormTheme();
  const colors =
    tone === "error"
      ? {
          surface: theme.dangerSurface,
          border: theme.danger,
          text: theme.dangerText,
        }
      : {
          surface: theme.warningSurface,
          border: theme.warning,
          text: theme.warningText,
        };

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.formNotice,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <ThemedText style={[styles.formNoticeText, { color: colors.text }]}>
        {text}
      </ThemedText>
    </View>
  );
}
