import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { syncStyles as styles } from "../styles/sync.styles";

export interface SyncRetryButtonProps {
  syncing: boolean;
  onPress: () => void;
}

/**
 * Manual push/pull cycle, shared by the Settings block and the sync center. It
 * stays disabled (and announces it) while a cycle is already running.
 */
export function SyncRetryButton({ syncing, onPress }: SyncRetryButtonProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("sync");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("status.retryAccessibility")}
      accessibilityHint={t("status.retryHint")}
      accessibilityState={{ disabled: syncing }}
      disabled={syncing}
      onPress={onPress}
      style={({ pressed }) => [
        styles.retryButton,
        { borderColor: theme.border, backgroundColor: theme.surface },
        syncing && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {syncing ? (
        <ActivityIndicator size="small" color={theme.primary} />
      ) : (
        <Ionicons
          name="refresh"
          size={16}
          color={theme.primary}
          accessible={false}
        />
      )}
      <ThemedText style={[styles.retryText, { color: theme.primary }]}>
        {t("status.retry")}
      </ThemedText>
    </Pressable>
  );
}
