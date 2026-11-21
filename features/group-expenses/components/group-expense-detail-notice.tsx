import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { groupExpensesStyles as styles } from "../styles/group-expenses.styles";

export interface GroupExpenseDetailNoticeProps {
  message: string;
}

/** Warning shown when a former member keeps the expense read-only. */
export function GroupExpenseDetailNotice({
  message,
}: GroupExpenseDetailNoticeProps) {
  const theme = useFormTheme();

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.notice,
        {
          backgroundColor: theme.warningSurface,
          borderColor: theme.warning,
        },
      ]}
    >
      <ThemedText style={[styles.noticeText, { color: theme.warningText }]}>
        {message}
      </ThemedText>
    </View>
  );
}
