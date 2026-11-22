import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionFormStyles as styles } from "../styles/transaction-form.styles";

export interface TransactionFormNoticeProps {
  /** Already translated: a service error or the first field error. */
  text: string;
  tone: "error" | "notice";
}

/**
 * Bottom notice of the movement form. A service error is an error (red); a
 * field error is only a notice (amber), because the field already shows its
 * own text next to the highlighted value.
 */
export function TransactionFormNotice({
  text,
  tone,
}: TransactionFormNoticeProps) {
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
