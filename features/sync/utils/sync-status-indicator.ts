/** Icons the sync header indicator can render. */
export type SyncStatusIndicatorIcon =
  | "cloud-offline-outline"
  | "alert-circle-outline"
  | "cloud-upload-outline";

export interface SyncStatusIndicator {
  icon: SyncStatusIndicatorIcon;
  /** Badge value; the badge is hidden when it is zero. */
  count: number;
  /** Plural base key inside the `sync` namespace. */
  labelKey: string;
  /** Number the label interpolates (conflicts and pending are not the same). */
  labelCount: number;
}

export interface SyncStatusIndicatorInput {
  enabled: boolean;
  isOffline: boolean;
  pendingCount: number;
  conflictCount: number;
}

const NO_BADGE = 0;

/**
 * Decides the header indicator. Conflicts win over the connection state (they
 * need a decision), then offline, then pending uploads; online with nothing to
 * report hides the button. The badge counts everything that still needs the
 * user, while the label announces only the reason that won.
 */
export function resolveSyncStatusIndicator({
  enabled,
  isOffline,
  pendingCount,
  conflictCount,
}: SyncStatusIndicatorInput): SyncStatusIndicator | null {
  if (!enabled) return null;

  const total = pendingCount + conflictCount;

  if (conflictCount > 0) {
    return {
      icon: "alert-circle-outline",
      count: total,
      labelKey: "headerStatus.conflicts",
      labelCount: conflictCount,
    };
  }

  if (isOffline) {
    return pendingCount > 0
      ? {
          icon: "cloud-offline-outline",
          count: pendingCount,
          labelKey: "headerStatus.offlinePending",
          labelCount: pendingCount,
        }
      : {
          icon: "cloud-offline-outline",
          count: NO_BADGE,
          labelKey: "headerStatus.offline",
          labelCount: NO_BADGE,
        };
  }

  if (pendingCount > 0) {
    return {
      icon: "cloud-upload-outline",
      count: pendingCount,
      labelKey: "headerStatus.pending",
      labelCount: pendingCount,
    };
  }

  return null;
}
