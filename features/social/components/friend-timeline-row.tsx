import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { friendTimelineStyles as styles } from "../styles/friend-timeline.styles";

export interface FriendTimelineRowProps {
  /** ISO calendar date; the gutter shows its short month above the day. */
  date: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  iconBackground: string;
  title: string;
  meta?: string;
  /** Optional right-aligned effect, already translated and formatted. */
  amount?: string;
  amountColor?: string;
  accessibilityLabel: string;
  accessibilityHint: string;
  onPress: () => void;
}

/** Intl appends a period to some short months ("nov."); the mockup has none. */
function stripTrailingPeriod(value: string): string {
  return value.replace(/\.+$/, "");
}

/**
 * One movement of the friend register: date gutter, icon tile, title, optional
 * meta and optional right-side amount. It has no card border and no chevron, so
 * consecutive rows read as a single history.
 */
export function FriendTimelineRow({
  date,
  icon,
  iconColor,
  iconBackground,
  title,
  meta,
  amount,
  amountColor,
  accessibilityLabel,
  accessibilityHint,
  onPress,
}: FriendTimelineRowProps) {
  const theme = useFormTheme();
  const locale = useAppLocale();
  const month = stripTrailingPeriod(locale.formatDate(date, { month: "short" }));
  const day = locale.formatDate(date, { day: "numeric" });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View
        style={styles.gutter}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <ThemedText style={[styles.gutterMonth, { color: theme.muted }]}>
          {month}
        </ThemedText>
        <ThemedText style={[styles.gutterDay, { color: theme.text }]}>
          {day}
        </ThemedText>
      </View>

      <View style={[styles.iconTile, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={20} color={iconColor} accessible={false} />
      </View>

      <View style={styles.body}>
        <ThemedText
          type="defaultSemiBold"
          style={styles.title}
          numberOfLines={1}
        >
          {title}
        </ThemedText>
        {meta ? (
          <ThemedText
            style={[styles.meta, { color: theme.muted }]}
            numberOfLines={1}
          >
            {meta}
          </ThemedText>
        ) : null}
      </View>

      {amount ? (
        <View style={styles.amountColumn}>
          <ThemedText
            style={[
              styles.amountText,
              { color: amountColor ?? theme.text },
            ]}
            numberOfLines={2}
          >
            {amount}
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}
