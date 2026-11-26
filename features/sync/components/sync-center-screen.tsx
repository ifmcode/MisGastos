import { useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { EmptyState } from "@/shared/components/molecules/empty-state";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { useSyncCenter } from "../hooks/use-sync-center";
import { syncStyles as styles } from "../styles/sync.styles";
import { SyncCenterHeader } from "./sync-center-header";
import { SyncConflictDialog } from "./sync-conflict-dialog";
import { SyncConflictRow } from "./sync-conflict-row";
import { SyncStatusSummary } from "./sync-status-summary";

/**
 * Sync center: counters, last cycle, manual retry and the open conflicts, each
 * one opening the decision sheet. Every rule lives in `useSyncCenter`.
 */
export function SyncCenterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useScopedTranslation("sync");
  const center = useSyncCenter();

  const leave = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)" as Href);
  }, [router]);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <SyncCenterHeader
        title={t("center.title")}
        subtitle={t("center.subtitle")}
        onBack={leave}
      />

      {center.enabled ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SyncStatusSummary
            pendingCount={center.pendingCount}
            conflictCount={center.conflictCount}
            lastSyncAt={center.lastSyncAt}
            lastErrorCode={center.lastErrorCode}
            syncing={center.syncing}
            onRetry={center.retry}
          />

          {center.conflicts.length === 0 ? (
            <EmptyState
              variant="card"
              title={t("center.emptyTitle")}
              message={t("center.emptyMessage")}
            />
          ) : (
            <View style={styles.conflictsSection}>
              <ThemedText style={styles.sectionTitle}>
                {t("center.conflictsTitle")}
              </ThemedText>
              {center.conflicts.map((view) => (
                <SyncConflictRow
                  key={view.id}
                  view={view}
                  onPress={() => center.openConflict(view.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.disabledContent}>
          <EmptyState
            icon="cloud-offline-outline"
            title={t("center.disabledTitle")}
            message={t("center.disabledMessage")}
          />
        </View>
      )}

      <SyncConflictDialog
        visible={center.selected !== null}
        view={center.selected}
        resolving={center.resolving}
        errorMessage={center.resolveError}
        onResolve={(choice) => void center.resolve(choice)}
        onClose={center.closeConflict}
      />
    </ThemedView>
  );
}
