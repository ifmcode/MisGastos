import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { readCachedWallets } from "@/features/wallets/repositories/local-wallet.cache";
import type { LocalConflictResolution } from "@/shared/lib/local-db/local-db.types";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { useSync } from "../providers/sync-context";
import {
  toSyncConflictView,
  type SyncConflictView,
} from "../utils/sync-conflict-view";

export interface SyncCenterState {
  enabled: boolean;
  syncing: boolean;
  pendingCount: number;
  conflictCount: number;
  lastSyncAt: string | null;
  lastErrorCode: string | null;
  conflicts: SyncConflictView[];
  selected: SyncConflictView | null;
  resolving: boolean;
  resolveError: string | null;
  retry: () => void;
  openConflict: (conflictId: string) => void;
  closeConflict: () => void;
  resolve: (choice: LocalConflictResolution) => Promise<void>;
}

/**
 * State of the sync center screen: the shared runtime overview, the view model
 * of each open conflict and the dialog lifecycle. The screen only renders it.
 */
export function useSyncCenter(): SyncCenterState {
  const sync = useSync();
  const { user } = useAuth();
  const { t } = useScopedTranslation("sync");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [walletNames, setWalletNames] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );

  useEffect(() => {
    if (!user) return undefined;

    let active = true;
    void readCachedWallets(user.uid).then((wallets) => {
      if (!active || !wallets) return;
      setWalletNames(new Map(wallets.map((wallet) => [wallet.id, wallet.name])));
    });

    return () => {
      active = false;
    };
  }, [user]);

  const conflicts = useMemo(
    () => sync.conflicts.map((conflict) => toSyncConflictView(conflict, walletNames)),
    [sync.conflicts, walletNames],
  );
  const selected = conflicts.find((view) => view.id === selectedId) ?? null;

  const openConflict = useCallback((conflictId: string) => {
    setResolveError(null);
    setSelectedId(conflictId);
  }, []);

  const closeConflict = useCallback(() => {
    if (resolving) return;

    setResolveError(null);
    setSelectedId(null);
  }, [resolving]);

  const { resolveConflict } = sync;

  const resolve = useCallback(
    async (choice: LocalConflictResolution) => {
      if (!selectedId) return;

      setResolving(true);
      setResolveError(null);

      try {
        await resolveConflict(selectedId, choice);
        setSelectedId(null);
      } catch {
        setResolveError(t("conflict.resolveError"));
      } finally {
        setResolving(false);
      }
    },
    [resolveConflict, selectedId, t],
  );

  return {
    enabled: sync.enabled,
    syncing: sync.status === "syncing",
    pendingCount: sync.pendingCount,
    conflictCount: sync.conflictCount,
    lastSyncAt: sync.lastSyncAt,
    lastErrorCode: sync.lastErrorCode,
    conflicts,
    selected,
    resolving,
    resolveError,
    retry: sync.retry,
    openConflict,
    closeConflict,
    resolve,
  };
}
