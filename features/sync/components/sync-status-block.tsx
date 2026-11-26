import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { useSyncStatusCopy } from "../hooks/use-sync-status-copy";
import { useSync } from "../providers/sync-context";
import { syncStyles as styles } from "../styles/sync.styles";
import { SyncRetryButton } from "./sync-retry-button";

/**
 * Settings entry point of the offline sync. It renders only while the local
 * database feature is on, and shows the same counters as the sync center.
 */
export function SyncStatusBlock() {
  const theme = useFormTheme();
  const router = useRouter();
  const sync = useSync();
  const { t } = useScopedTranslation("sync");
  const copy = useSyncStatusCopy({
    pendingCount: sync.pendingCount,
    conflictCount: sync.conflictCount,
    lastSyncAt: sync.lastSyncAt,
  });

  if (!sync.enabled) return null;

  return (
    <View
      style={[
        styles.block,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <View style={styles.blockHeader}>
        <Ionicons name="sync-outline" size={20} color={theme.primary} />
        <ThemedText type="defaultSemiBold" style={styles.blockTitle}>
          {t("status.title")}
        </ThemedText>
      </View>

      <ThemedText style={[styles.blockLine, { color: theme.muted }]}>
        {copy.pendingLabel}
      </ThemedText>

      {copy.conflictLabel ? (
        <ThemedText style={[styles.blockLine, { color: theme.dangerText }]}>
          {copy.conflictLabel}
        </ThemedText>
      ) : null}

      <ThemedText style={[styles.blockLine, { color: theme.muted }]}>
        {copy.lastSyncLabel}
      </ThemedText>

      <View style={styles.blockActions}>
        <SyncRetryButton
          syncing={sync.status === "syncing"}
          onPress={sync.retry}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("status.openCenterAccessibility")}
          accessibilityHint={t("status.openCenterHint")}
          onPress={() => router.push("/sync")}
          style={({ pressed }) => [
            styles.linkButton,
            pressed && styles.pressed,
          ]}
        >
          <ThemedText style={[styles.linkText, { color: theme.primary }]}>
            {t("status.openCenter")}
          </ThemedText>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.primary}
            accessible={false}
          />
        </Pressable>
      </View>
    </View>
  );
}
