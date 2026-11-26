import type { OutboxMutation } from "@/shared/lib/local-db/local-db.types";
import type { LocalOutboxRepository } from "@/shared/lib/local-db/local-outbox.repository";

import type { SyncMutationApplier } from "./sync.applier.types";
import { computeNextAttemptAt } from "./backoff";
import type { RemoteMutationExecutor } from "./sync.types";

export type PushCounters = {
  pushed: number;
  conflicts: number;
  failed: number;
};

export type PushResult = {
  /** The queue cannot advance (conflict, permanent error or retry window). */
  stopped: boolean;
  /** A transient (connectivity) error: the pull must wait for the next cycle. */
  transient: boolean;
  errorCode: string | null;
};

export type PushDependencies = {
  executor: RemoteMutationExecutor;
  applier: SyncMutationApplier;
  now: () => string;
  random?: () => number;
  maxMutationsPerRun?: number;
};

const DEFAULT_MAX_MUTATIONS = 50;

/**
 * Drains the queue strictly in `seq` order until it is empty, a transient error
 * pauses it, or a conflict/permanent error stops it (ADR §5.1). Head-of-line
 * blocking is intentional: financial order matters more than throughput.
 */
export async function pushOutbox(
  ownerId: string,
  outbox: LocalOutboxRepository,
  counters: PushCounters,
  deps: PushDependencies,
): Promise<PushResult> {
  const limit = deps.maxMutationsPerRun ?? DEFAULT_MAX_MUTATIONS;

  for (let index = 0; index < limit; index += 1) {
    const now = deps.now();
    const mutation = await outbox.getNext(ownerId, now);
    if (!mutation) {
      return { stopped: false, transient: false, errorCode: null };
    }

    const outcome = await pushOne(ownerId, outbox, mutation, counters, deps, now);

    if (outcome) return outcome;
  }

  return { stopped: false, transient: false, errorCode: null };
}

/** Returns a result only when the cycle must stop; null means "keep going". */
async function pushOne(
  ownerId: string,
  outbox: LocalOutboxRepository,
  mutation: OutboxMutation,
  counters: PushCounters,
  deps: PushDependencies,
  now: string,
): Promise<PushResult | null> {
  await outbox.markSyncing(ownerId, mutation.clientMutationId, now);
  const outcome = await deps.executor.execute(mutation);
  const attempts = mutation.attempts + 1;

  switch (outcome.status) {
    case "applied":
    case "replayed":
      await deps.applier.applySuccess({
        ownerId,
        mutation,
        revisionAfter: outcome.revisionAfter,
        wallets: outcome.wallets,
        now,
      });
      counters.pushed += 1;
      return null;
    case "conflict":
      await deps.applier.applyConflict({
        ownerId,
        mutation,
        kind: outcome.kind,
        errorCode: outcome.errorCode,
        remoteSnapshot: outcome.remoteSnapshot,
        now,
      });
      counters.conflicts += 1;
      return { stopped: true, transient: false, errorCode: null };
    case "retry":
      await deps.applier.applyFailure({
        ownerId,
        mutation,
        errorCode: outcome.errorCode,
        attempts,
        nextAttemptAt: computeNextAttemptAt(
          attempts,
          new Date(now),
          deps.random,
        ),
        now,
      });
      return { stopped: true, transient: true, errorCode: outcome.errorCode };
    case "failed":
      await deps.applier.applyFailure({
        ownerId,
        mutation,
        errorCode: outcome.errorCode,
        attempts,
        nextAttemptAt: null,
        now,
      });
      counters.failed += 1;
      return { stopped: true, transient: false, errorCode: outcome.errorCode };
  }
}
