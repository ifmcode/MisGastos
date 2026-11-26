import { LocalConflictRepository } from "@/shared/lib/local-db/local-conflict.repository";
import type { LocalConflict } from "@/shared/lib/local-db/local-db.types";
import { getLocalDatabase } from "@/shared/lib/local-db/local-db.runtime";
import { LocalOutboxRepository } from "@/shared/lib/local-db/local-outbox.repository";
import { LocalSyncStateRepository } from "@/shared/lib/local-db/sync-state.repository";

/** Snapshot the sync UI renders: counters, last cycle and open conflicts. */
export type SyncOverview = {
  pendingCount: number;
  conflictCount: number;
  lastSyncAt: string | null;
  lastErrorCode: string | null;
  conflicts: LocalConflict[];
};

const EMPTY_OVERVIEW: SyncOverview = {
  pendingCount: 0,
  conflictCount: 0,
  lastSyncAt: null,
  lastErrorCode: null,
  conflicts: [],
};

/** Reads the account state, or empty defaults when no local database exists. */
export async function readSyncOverview(
  ownerId: string,
): Promise<SyncOverview> {
  const port = await getLocalDatabase();
  if (!port) return { ...EMPTY_OVERVIEW };

  try {
    const outbox = new LocalOutboxRepository(port);
    const conflicts = new LocalConflictRepository(port);
    const state = new LocalSyncStateRepository(port);

    const [pendingCount, conflictCount, syncState, open] = await Promise.all([
      outbox.countPending(ownerId),
      conflicts.countOpen(ownerId),
      state.get(ownerId),
      conflicts.listOpen(ownerId),
    ]);

    return {
      pendingCount,
      conflictCount,
      lastSyncAt: syncState.lastFullSyncAt ?? syncState.lastPullAt,
      lastErrorCode: syncState.lastErrorCode,
      conflicts: open,
    };
  } catch {
    return { ...EMPTY_OVERVIEW };
  }
}
