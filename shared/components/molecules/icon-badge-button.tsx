import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { iconBadgeButtonStyles as styles } from "./icon-badge-button.styles";

export interface IconBadgeButtonProps {
  /** Ionicons glyph rendered by the button. */
  icon: ComponentProps<typeof Ionicons>["name"];
  /** Highlighted counter; the badge is hidden when it is zero. */
  count: number;
  /** Already translated label that announces the count. */
  accessibilityLabel: string;
  /** Already translated hint that explains where the button goes. */
  accessibilityHint: string;
  onPress: () => void;
}

/**
 * Icon-only header button with a shared count badge. Both the dashboard bell and
 * the Social requests entry point use it, so the highlighted badge is written
 * once: `theme.danger` fill, `theme.onPrimary` text and a `99+` cap. The badge is
 * decorative: the caller's label already announces the count, so screen readers
 * read it only once.
 */
export function IconBadgeButton({
  icon,
  count,
  accessibilityLabel,
  accessibilityHint,
  onPress,
}: IconBadgeButtonProps) {
  const theme = useFormTheme();
  const badge = count > 99 ? "99+" : String(count);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={24} color={theme.text} accessible={false} />

      {count > 0 ? (
        <View
          style={[styles.badge, { backgroundColor: theme.danger }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <ThemedText style={[styles.badgeText, { color: theme.onPrimary }]}>
            {badge}
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}
