import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { friendTimelineStyles as styles } from "../styles/friend-timeline.styles";

/**
 * "Debt settled" card, shown only when the open cycle is empty: the pair owes
 * nothing right now and the history below is closed.
 */
export function FriendTimelineSettledNotice() {
  const theme = useFormTheme();
  const { t } = useTranslation("settlements");

  return (
    <View
      style={[
        styles.settledNotice,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <ThemedText style={[styles.settledTitle, { color: theme.success }]}>
        {t("expenses.settledTitle")}
      </ThemedText>
      <ThemedText style={[styles.settledMessage, { color: theme.muted }]}>
        {t("expenses.settledMessage")}
      </ThemedText>
    </View>
  );
}
