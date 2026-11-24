import { LOCAL_DB_ERROR_CODES, LocalDbError } from "./local-db.errors";
import type { OutboxMutation, OutboxStatus } from "./local-db.types";

/**
 * `pending -> pending` is valid: coalescing merges the payload and the row
 * stays pending.
 */
const ALLOWED_TRANSITIONS: Record<OutboxStatus, readonly OutboxStatus[]> = {
  pending: ["pending", "syncing", "failed", "conflict"],
  syncing: ["pending", "failed", "conflict"],
  failed: ["pending", "syncing", "conflict"],
  conflict: ["pending"],
};

export function canTransitionOutboxStatus(
  from: OutboxStatus,
  to: OutboxStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Stable-code guard: an invalid transition is a programming error. */
export function assertOutboxTransition(
  from: OutboxStatus,
  to: OutboxStatus,
): void {
  if (!canTransitionOutboxStatus(from, to)) {
    throw new LocalDbError(LOCAL_DB_ERROR_CODES.OUTBOX_INVALID_TRANSITION);
  }
}

/**
 * A queued mutation can only be replaced while nothing is in flight and no
 * conflict is open: a `syncing` row may already be applied server-side, and a
 * conflict keeps its evidence until the user decides (ADR §7).
 */
export function assertOutboxMutationCoalescible(
  mutation: OutboxMutation,
): void {
  if (mutation.status === "syncing") {
    throw new LocalDbError(LOCAL_DB_ERROR_CODES.OUTBOX_MUTATION_IN_FLIGHT);
  }

  if (mutation.status === "conflict") {
    throw new LocalDbError(LOCAL_DB_ERROR_CODES.OUTBOX_CONFLICT_UNRESOLVED);
  }
}

/** Rows the user still counts as "changes to sync" (`pending` + `failed`). */
export function isPendingOutboxStatus(status: OutboxStatus): boolean {
  return status === "pending" || status === "failed";
}
