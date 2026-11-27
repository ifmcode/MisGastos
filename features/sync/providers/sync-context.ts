import { createContext, useContext } from "react";

import type {
  LocalConflict,
  LocalConflictResolution,
} from "@/shared/lib/local-db/local-db.types";

export type SyncRuntimeStatus = "idle" | "syncing" | "error";

export interface SyncContextValue {
  /** False when the offline-first flag is off or there is no session. */
  enabled: boolean;
  status: SyncRuntimeStatus;
  /** True while the device has no connection (drives the header indicator). */
  isOffline: boolean;
  pendingCount: number;
  conflictCount: number;
  /** Last successful pull, ISO; null means "never". */
  lastSyncAt: string | null;
  lastErrorCode: string | null;
  conflicts: LocalConflict[];
  /** Manual push + pull cycle. */
  retry: () => void;
  /** Re-reads the account overview (counters, last cycle, open conflicts). */
  refresh: () => Promise<void>;
  resolveConflict: (
    conflictId: string,
    choice: LocalConflictResolution,
  ) => Promise<void>;
}

export const SYNC_DISABLED_VALUE: SyncContextValue = {
  enabled: false,
  status: "idle",
  isOffline: false,
  pendingCount: 0,
  conflictCount: 0,
  lastSyncAt: null,
  lastErrorCode: null,
  conflicts: [],
  retry: () => undefined,
  refresh: async () => undefined,
  resolveConflict: async () => undefined,
};

export const SyncContext = createContext<SyncContextValue>(
  SYNC_DISABLED_VALUE,
);

/** Sync state shared by the banner, Settings and the sync center. */
export function useSync(): SyncContextValue {
  return useContext(SyncContext);
}
