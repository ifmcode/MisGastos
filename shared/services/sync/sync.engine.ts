import type { DatabasePort } from "@/shared/lib/local-db/database.port";
import { OFFLINE_READ_CODE } from "@/shared/lib/local-db/offline-read";
import { LocalOutboxRepository } from "@/shared/lib/local-db/local-outbox.repository";
import { isOwnerLocalWritesRevoked } from "@/shared/lib/local-db/owner-revocation";
import { LocalSyncStateRepository } from "@/shared/lib/local-db/sync-state.repository";

import { readSyncErrorCode } from "./sync.errors";
import { SingleFlight } from "./single-flight";
import { pushOutbox, type PushCounters } from "./sync.push";
import type { SyncMutationApplier } from "./sync.applier.types";
import type { RemoteMutationExecutor, SyncRunResult } from "./sync.types";

export type SyncEngineDependencies = {
  getPort: () => Promise<DatabasePort | null>;
  now: () => string;
  executor: RemoteMutationExecutor;
  applier: SyncMutationApplier;
  /** Full owner-scoped pull, usually after the push cycle. */
  pull: (ownerId: string) => Promise<void>;
  random?: () => number;
  maxMutationsPerRun?: number;
};

function emptyResult(status: SyncRunResult["status"]): SyncRunResult {
  return {
    status,
    pushed: 0,
    conflicts: 0,
    failed: 0,
    pulled: false,
    deferred: false,
    pending: 0,
    errorCode: null,
  };
}

/**
 * Runs one push-then-pull cycle for one account: push in `seq` order, pause with
 * backoff on a transient error, stop on a conflict or a permanent error. Runs
 * are single-flight per account, so overlapping triggers cannot push twice.
 */
export class SyncEngine {
  private readonly runs = new SingleFlight<SyncRunResult>();

  constructor(private readonly deps: SyncEngineDependencies) {}

  sync(ownerId: string, options: { manual?: boolean } = {}): Promise<SyncRunResult> {
    return this.runs.run(ownerId, () =>
      this.run(ownerId, options.manual === true),
    );
  }

  /** Resolves when the account has no cycle in flight; a failed run does not reject. */
  whenIdle(ownerId: string): Promise<void> {
    return this.runs.whenIdle(ownerId);
  }

  private async run(
    ownerId: string,
    manual: boolean,
  ): Promise<SyncRunResult> {
    // Revoked (sign-out or purge in progress): a cycle now would recreate the
    // deleted rows; no error is reported because the account is not offline.
    if (isOwnerLocalWritesRevoked(ownerId)) {
      return { ...emptyResult("offline"), errorCode: null };
    }

    const port = await this.deps.getPort();
    if (!port) return { ...emptyResult("offline"), errorCode: "SYNC_OFFLINE" };

    const outbox = new LocalOutboxRepository(port);
    const counters: PushCounters = { pushed: 0, conflicts: 0, failed: 0 };
    let stopped = false;
    let transient = false;
    let errorCode: string | null = null;

    try {
      await outbox.reclaimInterrupted(ownerId, this.deps.now());
      if (manual) await outbox.requeueFailed(ownerId, this.deps.now());

      const pushed = await pushOutbox(ownerId, outbox, counters, this.deps);
      stopped = pushed.stopped;
      transient = pushed.transient;
      errorCode = pushed.errorCode;
    } catch (error) {
      errorCode = readSyncErrorCode(error);
    }

    const blocked = stopped;
    const pulled = transient
      ? { pulled: false, errorCode: null, deferred: false }
      : await this.pull(ownerId);
    errorCode = errorCode ?? pulled.errorCode;

    const now = this.deps.now();
    await this.saveState(port, ownerId, {
      pushed: counters.pushed,
      pulled: pulled.pulled,
      errorCode,
      now,
    });

    return {
      status: blocked ? "blocked" : "done",
      pushed: counters.pushed,
      conflicts: counters.conflicts,
      failed: counters.failed,
      pulled: pulled.pulled,
      deferred: pulled.deferred,
      pending: await this.countPending(outbox, ownerId),
      errorCode,
    };
  }

  private async pull(
    ownerId: string,
  ): Promise<{ pulled: boolean; errorCode: string | null; deferred: boolean }> {
    try {
      await this.deps.pull(ownerId);
      return { pulled: true, errorCode: null, deferred: false };
    } catch (error) {
      const errorCode = readSyncErrorCode(error);

      // An empty snapshot served from the SDK cache means Firestore had not
      // reconnected yet. It is not a sync failure: report it as deferred so the
      // caller retries the pull shortly instead of painting an error.
      if (errorCode === OFFLINE_READ_CODE) {
        return { pulled: false, errorCode: null, deferred: true };
      }

      return { pulled: false, errorCode, deferred: false };
    }
  }

  private async saveState(
    port: DatabasePort,
    ownerId: string,
    input: { pushed: number; pulled: boolean; errorCode: string | null; now: string },
  ): Promise<void> {
    try {
      await new LocalSyncStateRepository(port).save(ownerId, {
        lastPushAt: input.pushed > 0 ? input.now : undefined,
        lastPullAt: input.pulled ? input.now : undefined,
        lastFullSyncAt: input.pulled ? input.now : undefined,
        lastErrorCode: input.errorCode,
      });
    } catch {
      // The cycle result already carries the failure; bookkeeping is best effort.
    }
  }

  private async countPending(
    outbox: LocalOutboxRepository,
    ownerId: string,
  ): Promise<number> {
    try {
      return await outbox.countPending(ownerId);
    } catch {
      return 0;
    }
  }
}
