import { useMemo } from "react";

import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

export interface SyncStatusCopyInput {
  pendingCount: number;
  conflictCount: number;
  lastSyncAt: string | null;
}

/** Translated status lines shared by the Settings block and the sync center. */
export interface SyncStatusCopy {
  pendingLabel: string;
  /** Null while there is nothing to resolve. */
  conflictLabel: string | null;
  lastSyncLabel: string;
}

export function useSyncStatusCopy({
  pendingCount,
  conflictCount,
  lastSyncAt,
}: SyncStatusCopyInput): SyncStatusCopy {
  const { t } = useScopedTranslation("sync");
  const { formatRelative } = useAppLocale();

  return useMemo(
    () => ({
      pendingLabel: t("status.pending", { count: pendingCount }),
      conflictLabel:
        conflictCount > 0
          ? t("status.conflicts", { count: conflictCount })
          : null,
      lastSyncLabel: t("status.lastSync", {
        value: lastSyncAt ? formatRelative(lastSyncAt) : t("status.never"),
      }),
    }),
    [conflictCount, formatRelative, lastSyncAt, pendingCount, t],
  );
}
