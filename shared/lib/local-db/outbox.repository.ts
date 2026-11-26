import type { LocalDatabaseTransaction } from "./database.port";
import type {
  OutboxEntityType,
  OutboxMutation,
  OutboxMutationInput,
  OutboxOperation,
} from "./local-db.types";

export type MarkOutboxFailedInput = {
  errorCode: string;
  attempts: number;
  nextAttemptAt: string | null;
  now: string;
};

export type MarkOutboxConflictInput = {
  errorCode: string;
  now: string;
};

/** Payload that turns a conflicted mutation into a fresh pending attempt. */
export type RebaseOutboxInput = {
  operation: OutboxOperation;
  baseRevision: number;
  serverSnapshot: Record<string, unknown>;
  localSnapshot?: Record<string, unknown>;
  now: string;
};

/**
 * One ordered queue per account. Every state change is guarded by the outbox
 * state machine; repositories never expose user-facing sentences.
 *
 * Every write accepts an optional trailing `tx`: pass it to join the
 * transaction of the use case (record + balance + outbox row commit together);
 * omit it and the repository owns the transaction.
 */
export interface IOutboxRepository {
  /** Inserts or coalesces the mutation for `(owner, entityType, entityId)`. */
  enqueue(
    input: OutboxMutationInput,
    tx?: LocalDatabaseTransaction,
  ): Promise<OutboxMutation>;
  /** Every queued mutation, `seq` ascending. */
  listByOwner(
    ownerId: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<OutboxMutation[]>;
  /** The queued mutation of one entity, if any (used inside local writes). */
  find(
    ownerId: string,
    entityType: OutboxEntityType,
    entityId: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<OutboxMutation | null>;
  /** The queued mutation with that idempotency key, if any. */
  findById(
    ownerId: string,
    clientMutationId: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<OutboxMutation | null>;
  /** `pending` and `failed` rows, `seq` ascending. */
  listPending(ownerId: string): Promise<OutboxMutation[]>;
  countPending(ownerId: string): Promise<number>;
  countConflicts(ownerId: string): Promise<number>;
  markSyncing(
    ownerId: string,
    clientMutationId: string,
    now: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<OutboxMutation>;
  markFailed(
    ownerId: string,
    clientMutationId: string,
    input: MarkOutboxFailedInput,
    tx?: LocalDatabaseTransaction,
  ): Promise<OutboxMutation>;
  markConflict(
    ownerId: string,
    clientMutationId: string,
    input: MarkOutboxConflictInput,
    tx?: LocalDatabaseTransaction,
  ): Promise<OutboxMutation>;
  /**
   * "Keep mine" after a conflict: rebases the mutation to the remote revision
   * and puts it back to `pending`. The conflict row keeps the evidence.
   */
  rebase(
    ownerId: string,
    clientMutationId: string,
    input: RebaseOutboxInput,
    tx?: LocalDatabaseTransaction,
  ): Promise<OutboxMutation>;
  /** Deletes the row after a successful push. */
  remove(
    ownerId: string,
    clientMutationId: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<void>;
  /** Requeues rows left `syncing` by a crash; returns the requeued rows. */
  reclaimInterrupted(
    ownerId: string,
    now: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<OutboxMutation[]>;
  /**
   * Manual retry: every `failed` row goes back to `pending` with a cleared
   * window, so a permanent error can be resumed after the user fixes its cause.
   */
  requeueFailed(
    ownerId: string,
    now: string,
    tx?: LocalDatabaseTransaction,
  ): Promise<OutboxMutation[]>;
  /** Head of the queue when it may be pushed at `now`. */
  getNext(ownerId: string, now: string): Promise<OutboxMutation | null>;
}
