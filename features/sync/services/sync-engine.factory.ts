import { getLocalDatabase } from "@/shared/lib/local-db/local-db.runtime";
import { SyncEngine } from "@/shared/services/sync/sync.engine";

import { FirestoreSyncExecutor } from "./firestore-sync-executor";
import { LocalSyncApplier } from "./local-sync-applier";
import { pullOwnerData } from "./sync-pull";

let engine: SyncEngine | null = null;

/** Runtime engine: the Firestore executor plus the local applier and pull. */
export function getSyncEngine(): SyncEngine {
  if (!engine) {
    engine = new SyncEngine({
      getPort: getLocalDatabase,
      now: () => new Date().toISOString(),
      executor: new FirestoreSyncExecutor(),
      applier: new LocalSyncApplier(getLocalDatabase),
      pull: pullOwnerData,
    });
  }

  return engine;
}

/** Test seam: drops the memoized engine so a fake can be injected. */
export function resetSyncEngine(): void {
  engine = null;
}
