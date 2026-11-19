import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { friendTimelineStyles as styles } from "../styles/friend-timeline.styles";

/**
 * Divider between the open cycle and the settled history. The lines are
 * decorative, so only the label reaches a screen reader, as a section header.
 */
export function FriendTimelineSeparator() {
  const theme = useFormTheme();
  const { t } = useTranslation("settlements");

  return (
    <View style={styles.separator}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.separatorLine, { backgroundColor: theme.border }]}
      />
      <ThemedText
        accessibilityRole="header"
        style={[styles.separatorLabel, { color: theme.muted }]}
      >
        {t("expenses.settledSeparator")}
      </ThemedText>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.separatorLine, { backgroundColor: theme.border }]}
      />
    </View>
  );
}
