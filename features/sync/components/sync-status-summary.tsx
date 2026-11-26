import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { useSyncStatusCopy } from "../hooks/use-sync-status-copy";
import { syncStyles as styles } from "../styles/sync.styles";
import { SyncRetryButton } from "./sync-retry-button";

export interface SyncStatusSummaryProps {
  pendingCount: number;
  conflictCount: number;
  lastSyncAt: string | null;
  lastErrorCode: string | null;
  syncing: boolean;
  onRetry: () => void;
}

/** Counters, last cycle and last error of the sync center card. */
export function SyncStatusSummary({
  pendingCount,
  conflictCount,
  lastSyncAt,
  lastErrorCode,
  syncing,
  onRetry,
}: SyncStatusSummaryProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("sync");
  const copy = useSyncStatusCopy({ pendingCount, conflictCount, lastSyncAt });

  return (
    <View
      style={[
        styles.summaryCard,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <ThemedText style={styles.summaryLine}>{copy.pendingLabel}</ThemedText>

      {copy.conflictLabel ? (
        <ThemedText style={[styles.summaryLine, { color: theme.dangerText }]}>
          {copy.conflictLabel}
        </ThemedText>
      ) : null}

      <ThemedText style={[styles.summaryLine, { color: theme.muted }]}>
        {copy.lastSyncLabel}
      </ThemedText>

      {lastErrorCode ? (
        <View style={styles.summaryError}>
          <ThemedText
            style={[styles.blockLine, { color: theme.dangerText }]}
          >
            {t("center.lastError")}
          </ThemedText>
          <ThemedText style={[styles.blockLine, { color: theme.muted }]}>
            {lastErrorCode}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.summaryActions}>
        <SyncRetryButton syncing={syncing} onPress={onRetry} />
      </View>
    </View>
  );
}
