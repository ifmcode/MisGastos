import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { notificationsStyles as styles } from "../styles/notifications.styles";

export interface NotificationsMarkAllReadProps {
  /** Resolves when the stamps are written; the row shows its busy state. */
  onPress: () => Promise<void>;
}

/** "Marcar todo como leído" action, only rendered in the Pendientes segment. */
export function NotificationsMarkAllRead({
  onPress,
}: NotificationsMarkAllReadProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("notifications");
  const [busy, setBusy] = useState(false);

  const handlePress = useCallback(() => {
    setBusy(true);
    void onPress().finally(() => setBusy(false));
  }, [onPress]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("markAllRead.accessibilityLabel")}
      accessibilityHint={t("markAllRead.hint")}
      accessibilityState={{ disabled: busy, busy }}
      disabled={busy}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.markAllRow,
        (pressed || busy) && styles.pressed,
      ]}
    >
      <Ionicons
        name="checkmark-done-outline"
        size={18}
        color={theme.primary}
        accessible={false}
      />
      <ThemedText style={[styles.markAllText, { color: theme.primary }]}>
        {t("markAllRead.label")}
      </ThemedText>
    </Pressable>
  );
}
