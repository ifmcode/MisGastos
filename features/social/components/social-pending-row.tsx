import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { socialStyles as styles } from "../styles/social.styles";

export interface SocialPendingRowProps {
  /** Incoming plus outgoing `pending` requests. */
  count: number;
  onPress: () => void;
}

/** Always-rendered entry point to the pending requests screen. */
export function SocialPendingRow({ count, onPress }: SocialPendingRowProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("social");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("pending.rowAccessibility", { count })}
      accessibilityHint={t("pending.hint")}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pendingRow,
        { borderColor: theme.border, backgroundColor: theme.surface },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name="mail-unread-outline"
        size={22}
        color={theme.primary}
        accessible={false}
      />

      <View style={styles.pendingBody}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {t("pending.title")}
        </ThemedText>
        <ThemedText
          style={[styles.pendingCount, { color: theme.muted }]}
          numberOfLines={2}
        >
          {count > 0 ? t("pending.count", { count }) : t("pending.empty")}
        </ThemedText>
      </View>

      {count > 0 ? (
        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
          <ThemedText style={[styles.badgeText, { color: theme.onPrimary }]}>
            {count}
          </ThemedText>
        </View>
      ) : null}

      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.muted}
        accessible={false}
      />
    </Pressable>
  );
}
