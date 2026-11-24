import type { OutboxMutation } from "./local-db.types";

function sortBySeq(mutations: OutboxMutation[]): OutboxMutation[] {
  return [...mutations].sort((left, right) => left.seq - right.seq);
}

/**
 * A `failed` mutation is retried once its window opens. `null` means a
 * permanent failure that only a user action resumes. ISO timestamps are
 * comparable as strings because the whole layer writes UTC ISO-8601.
 */
function isEligibleHead(head: OutboxMutation, now: string): boolean {
  if (head.status === "pending") return true;
  if (head.status !== "failed") return false;

  return head.nextAttemptAt !== null && head.nextAttemptAt <= now;
}

/** Queued rows that satisfy one of `head.dependsOn`, lowest `seq` first. */
function findQueuedDependencies(
  head: OutboxMutation,
  mutations: OutboxMutation[],
): OutboxMutation[] {
  return sortBySeq(mutations).filter(
    (candidate) =>
      candidate.clientMutationId !== head.clientMutationId &&
      head.dependsOn.some(
        (dependency) =>
          dependency.entityType === candidate.entityType &&
          dependency.entityId === candidate.entityId,
      ),
  );
}

/**
 * Next mutation the engine may push. The queue is strictly ordered, so only the
 * lowest `seq` row is a candidate; it must be eligible (pending, or failed
 * inside its retry window) and every entity it depends on must already be gone
 * from the outbox. Head-of-line blocking is intentional.
 */
export function selectNextOutboxMutation(
  mutations: OutboxMutation[],
  now: string,
): OutboxMutation | null {
  const head = sortBySeq(mutations)[0];

  if (!head) return null;
  if (!isEligibleHead(head, now)) return null;
  if (findQueuedDependencies(head, mutations).length > 0) return null;

  return head;
}

/**
 * Why the queue cannot advance, for the UI and diagnostics: the head when its
 * status or retry window blocks it, otherwise the queued dependency waiting to
 * be pushed. `null` means nothing is blocked.
 */
export function getBlockingOutboxMutation(
  mutations: OutboxMutation[],
  now: string,
): OutboxMutation | null {
  const head = sortBySeq(mutations)[0];

  if (!head) return null;
  if (!isEligibleHead(head, now)) return head;

  return findQueuedDependencies(head, mutations)[0] ?? null;
}
