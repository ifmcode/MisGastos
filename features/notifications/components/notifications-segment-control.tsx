import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { notificationsStyles as styles } from "../styles/notifications.styles";
import type {
  NotificationSegment,
  NotificationSegmentCounts,
} from "../types/notification-segment.types";

export interface NotificationsSegmentControlProps {
  segment: NotificationSegment;
  counts: NotificationSegmentCounts;
  onChange: (segment: NotificationSegment) => void;
}

/** "Pendientes" / "Vistas" switch with the count of each and tab semantics. */
export function NotificationsSegmentControl({
  segment,
  counts,
  onChange,
}: NotificationsSegmentControlProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("notifications");

  const options = [
    {
      value: "pending" as const,
      label: t("segments.pending"),
      count: counts.pending,
      accessibilityLabel: t("segments.pendingAccessibility", {
        count: counts.pending,
      }),
    },
    {
      value: "viewed" as const,
      label: t("segments.viewed"),
      count: counts.viewed,
      accessibilityLabel: t("segments.viewedAccessibility", {
        count: counts.viewed,
      }),
    },
  ];

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={t("segments.accessibility")}
      style={[
        styles.segmentControl,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      {options.map((option) => {
        const selected = option.value === segment;
        const color = selected ? theme.onPrimary : theme.text;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.accessibilityLabel}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              selected && { backgroundColor: theme.primary },
              pressed && styles.pressed,
            ]}
          >
            <ThemedText style={[styles.segmentText, { color }]}>
              {option.label}
            </ThemedText>
            <ThemedText style={[styles.segmentCount, { color }]}>
              {option.count}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
