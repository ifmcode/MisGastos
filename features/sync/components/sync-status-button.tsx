import { useRouter } from "expo-router";

import { IconBadgeButton } from "@/shared/components/molecules/icon-badge-button";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { useSync } from "../providers/sync-context";
import { resolveSyncStatusIndicator } from "../utils/sync-status-indicator";

/**
 * Header entry point of the offline state: a no-signal icon (or upload/conflict
 * icon) with the pending badge, left of the notifications/requests action of
 * every main tab. Tapping it opens the sync center, where the user can read the
 * pending movements, retry and resolve conflicts. It replaces the old bottom
 * strip so the app is not permanently covered.
 */
export function SyncStatusButton() {
  const router = useRouter();
  const sync = useSync();
  const { tr } = useScopedTranslation("sync");

  const indicator = resolveSyncStatusIndicator({
    enabled: sync.enabled,
    isOffline: sync.isOffline,
    pendingCount: sync.pendingCount,
    conflictCount: sync.conflictCount,
  });

  if (!indicator) return null;

  // The plain offline label has no count: passing `count: 0` would make
  // i18next look for a `_zero` plural variant that does not exist.
  const label =
    indicator.labelCount > 0
      ? tr(indicator.labelKey, { count: indicator.labelCount })
      : tr(indicator.labelKey);

  return (
    <IconBadgeButton
      icon={indicator.icon}
      count={indicator.count}
      accessibilityLabel={label}
      accessibilityHint={tr("headerStatus.hint")}
      onPress={() => router.push("/sync")}
    />
  );
}
