import { useCallback, useEffect, useRef, useState } from "react";

import type { LocalConflictResolution } from "@/shared/lib/local-db/local-db.types";
import { useNetworkStatus } from "@/shared/hooks/use-network-status";

import { resolveLocalConflict } from "../services/local-conflict-resolver";
import { getSyncEngine } from "../services/sync-engine.factory";
import { readSyncOverview } from "../services/sync-overview";
import type { SyncContextValue, SyncRuntimeStatus } from "../providers/sync-context";
import { SYNC_DISABLED_VALUE } from "../providers/sync-context";
import { useSyncTriggers } from "./use-sync-triggers";

type OverviewState = {
  pendingCount: number;
  conflictCount: number;
  lastSyncAt: string | null;
  lastErrorCode: string | null;
  conflicts: SyncContextValue["conflicts"];
  status: SyncRuntimeStatus;
};

const INITIAL_STATE: OverviewState = {
  pendingCount: 0,
  conflictCount: 0,
  lastSyncAt: null,
  lastErrorCode: null,
  conflicts: [],
  status: "idle",
};

function toNextStatus(
  current: SyncRuntimeStatus,
  pendingCount: number,
  errorCode: string | null,
): SyncRuntimeStatus {
  if (current === "syncing") return current;
  if (errorCode && pendingCount > 0) return "error";
  return "idle";
}

/**
 * Runtime of the sync center: reads the account overview, runs one push/pull
 * cycle at a time and exposes the manual retry and the conflict resolution.
 * The scheduling (login, reconnect, foreground, write debounce, timer) lives in
 * `useSyncTriggers`.
 */
export function useSyncRuntime(
  ownerId: string | null,
  enabled: boolean,
): SyncContextValue {
  const [state, setState] = useState<OverviewState>(INITIAL_STATE);
  const running = useRef(false);
  const mounted = useRef(true);
  const { isOffline } = useNetworkStatus(enabled);

  const refresh = useCallback(async () => {
    if (!ownerId) return;

    const overview = await readSyncOverview(ownerId);
    if (!mounted.current) return;

    setState((current) => ({
      ...overview,
      status: toNextStatus(
        current.status,
        overview.pendingCount,
        overview.lastErrorCode,
      ),
    }));
  }, [ownerId]);

  const run = useCallback(async (manual = false) => {
    if (!ownerId || running.current) return;

    running.current = true;
    if (mounted.current) {
      setState((current) => ({ ...current, status: "syncing" }));
    }

    try {
      await getSyncEngine().sync(ownerId, { manual });
    } finally {
      running.current = false;
      if (mounted.current) {
        setState((current) => ({ ...current, status: "idle" }));
      }
      await refresh();
    }
  }, [ownerId, refresh]);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !ownerId) {
      setState(INITIAL_STATE);
      return;
    }

    void refresh();
  }, [enabled, ownerId, refresh]);

  const runNow = useCallback(() => {
    void run();
  }, [run]);

  const retry = useCallback(() => {
    void run(true);
  }, [run]);

  useSyncTriggers({
    enabled,
    ownerId,
    isOffline,
    pendingCount: state.pendingCount,
    run: runNow,
  });

  const resolveConflict = useCallback(
    async (conflictId: string, choice: LocalConflictResolution) => {
      if (!ownerId) return;

      await resolveLocalConflict(ownerId, conflictId, choice);
      await run();
    },
    [ownerId, run],
  );

  if (!enabled || !ownerId) return SYNC_DISABLED_VALUE;

  return {
    enabled: true,
    isOffline,
    ...state,
    retry,
    resolveConflict,
  };
}
