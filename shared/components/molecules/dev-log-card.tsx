import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { DevLogEntry } from "@/lib/dev-log.store";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { devLogCardStyles as styles } from "./dev-log-card.styles";

export interface DevLogCardProps {
  entry: DevLogEntry;
  onDismiss: () => void;
}

/**
 * Dev-only, theme-aware replacement for the unreadable LogBox card. It shows
 * the level, the message (up to five lines) and a close action; the store
 * dismisses it automatically after a few seconds.
 */
export function DevLogCard({ entry, onDismiss }: DevLogCardProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("common");
  const isError = entry.level === "error";
  const color = isError ? theme.danger : theme.warning;
  const title = t(isError ? "devLog.error" : "devLog.warning");

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${title}: ${entry.message}`}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderLeftColor: color,
        },
      ]}
    >
      <Ionicons
        name={isError ? "alert-circle" : "warning"}
        size={20}
        color={color}
        accessible={false}
      />

      <View style={styles.body}>
        <ThemedText
          type="defaultSemiBold"
          style={[styles.title, { color }]}
        >
          {title}
        </ThemedText>
        <ThemedText
          numberOfLines={5}
          style={[styles.message, { color: theme.text }]}
        >
          {entry.message}
        </ThemedText>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("devLog.dismiss")}
        onPress={onDismiss}
        hitSlop={10}
        style={({ pressed }) => [styles.close, pressed && styles.pressed]}
      >
        <Ionicons name="close" size={18} color={theme.muted} accessible={false} />
      </Pressable>
    </View>
  );
}
