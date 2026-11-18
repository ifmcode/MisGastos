import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { notificationsStyles as styles } from "../styles/notifications.styles";
import type { NotificationRowModel } from "../utils/notification-rows";

export interface NotificationRowProps {
  row: NotificationRowModel;
  onPress: () => void;
}

/** Inbox row: type icon, resolved sentence, date and the unread marker. */
export function NotificationRow({ row, onPress }: NotificationRowProps) {
  const theme = useFormTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={row.accessibilityLabel}
      accessibilityHint={row.accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <View
        style={[
          styles.row,
          {
            borderColor: row.unread ? theme.primary : theme.border,
            backgroundColor: theme.surface,
          },
          row.unread && styles.rowUnread,
        ]}
      >
        <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
          <Ionicons
            name={row.icon}
            size={20}
            color={theme.primary}
            accessible={false}
          />
        </View>

        <View style={styles.body}>
          <ThemedText style={styles.rowTitle}>{row.title}</ThemedText>
          <ThemedText style={[styles.rowMeta, { color: theme.muted }]}>
            {row.meta}
          </ThemedText>
        </View>

        {row.unread ? (
          <View
            style={[styles.unreadDot, { backgroundColor: theme.primary }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        ) : null}
      </View>
    </Pressable>
  );
}
