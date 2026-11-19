import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { friendTimelineStyles as styles } from "../styles/friend-timeline.styles";

export interface FriendTimelineSettledToggleProps {
  /** True while the settled rows are on screen: the action then hides them. */
  expanded: boolean;
  onPress: () => void;
}

/**
 * Show/hide action of the settled history. The label, the hint and the tones
 * switch together so the two states never read as the same affordance.
 */
export function FriendTimelineSettledToggle({
  expanded,
  onPress,
}: FriendTimelineSettledToggleProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("settlements");
  const label = expanded
    ? t("expenses.hidePrevious")
    : t("expenses.showPrevious");
  const hint = expanded
    ? t("expenses.hidePreviousHint")
    : t("expenses.showPreviousHint");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.toggleButton,
        { borderColor: expanded ? theme.border : theme.primary },
        pressed && styles.pressed,
      ]}
    >
      <ThemedText
        style={[
          styles.toggleButtonText,
          { color: expanded ? theme.text : theme.primary },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}
