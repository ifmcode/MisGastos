import type { ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";
import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

import { useSyncRuntime } from "../hooks/use-sync-runtime";
import { SyncContext } from "./sync-context";

export interface SyncProviderProps {
  children: ReactNode;
}

/**
 * Owns the sync engine lifecycle for the signed-in account. Mounted once at the
 * root, so the banner, Settings and the sync center share one runtime and one
 * engine (the engine itself is single-flight).
 */
export function SyncProvider({ children }: SyncProviderProps) {
  const { user } = useAuth();
  const enabled = isOfflineFirstEnabled();
  const value = useSyncRuntime(enabled ? (user?.uid ?? null) : null, enabled);

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
