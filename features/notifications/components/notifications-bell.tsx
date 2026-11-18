import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { notificationsStyles as styles } from "../styles/notifications.styles";

export interface NotificationsBellProps {
  /** Unread notifications; the badge is hidden when it is zero. */
  count: number;
  onPress: () => void;
}

/** Dashboard bell with the unread badge and its screen-reader summary. */
export function NotificationsBell({ count, onPress }: NotificationsBellProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("notifications");
  const badge = count > 99 ? "99+" : String(count);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        count > 0 ? t("bell.label", { count }) : t("bell.label_zero")
      }
      accessibilityHint={t("bell.hint")}
      onPress={onPress}
      style={({ pressed }) => [styles.bell, pressed && styles.pressed]}
    >
      <Ionicons
        name="notifications-outline"
        size={24}
        color={theme.text}
        accessible={false}
      />
      {count > 0 ? (
        <View
          style={[styles.bellBadge, { backgroundColor: theme.danger }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <ThemedText style={[styles.bellBadgeText, { color: theme.onPrimary }]}>
            {badge}
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}
