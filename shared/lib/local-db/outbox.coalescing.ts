import type {
  OutboxMutation,
  OutboxMutationInput,
  OutboxOperation,
} from "./local-db.types";

/**
 * `null` means the two mutations cancel out and nothing must be sent. A record
 * deleted locally and re-created with the same id already is a `create` for the
 * server, so it becomes an `update` (never leave the server without the record
 * the user sees).
 */
const COALESCE_MATRIX: Record<
  OutboxOperation,
  Record<OutboxOperation, OutboxOperation | null>
> = {
  create: { create: "create", update: "create", delete: null },
  update: { create: "update", update: "update", delete: "delete" },
  delete: { create: "update", update: "delete", delete: "delete" },
};

/** Builds the row persisted for a brand-new entity (nothing queued yet). */
export function buildOutboxMutation(
  input: OutboxMutationInput,
  seq: number,
): OutboxMutation {
  return {
    clientMutationId: input.clientMutationId,
    ownerId: input.ownerId,
    seq,
    entityType: input.entityType,
    entityId: input.entityId,
    operation: input.operation,
    baseRevision: input.baseRevision,
    localSnapshot: input.localSnapshot,
    serverSnapshot: input.serverSnapshot ?? {},
    dependsOn: input.dependsOn ?? [],
    status: "pending",
    attempts: 0,
    nextAttemptAt: input.nextAttemptAt ?? null,
    lastErrorCode: input.lastErrorCode ?? null,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

/**
 * Merges a queued mutation with a newer one for the same record.
 *
 * `clientMutationId` identifies one immutable payload: it can never be reused
 * for a different one, because the server marker would report the new payload as
 * already applied. Every coalesce therefore takes the incoming id and resets the
 * retry state. `seq`, `baseRevision` and `serverSnapshot` (the revision the
 * server knows) survive so the new payload is guarded against concurrent edits.
 */
export function coalesceOutboxMutation(
  existing: OutboxMutation,
  incoming: OutboxMutationInput,
): OutboxMutation | null {
  const operation = resolveCoalescedOperation(existing, incoming);

  if (operation === null) return null;

  return {
    clientMutationId: incoming.clientMutationId,
    ownerId: existing.ownerId,
    seq: existing.seq,
    entityType: existing.entityType,
    entityId: existing.entityId,
    operation,
    baseRevision: existing.baseRevision,
    localSnapshot: incoming.localSnapshot,
    serverSnapshot: incoming.serverSnapshot ?? existing.serverSnapshot,
    dependsOn: incoming.dependsOn ?? existing.dependsOn,
    status: "pending",
    attempts: 0,
    nextAttemptAt: null,
    lastErrorCode: null,
    createdAt: existing.createdAt,
    updatedAt: incoming.now,
  };
}

/**
 * A create that was already attempted may exist on the server, so merging an
 * edit into it cannot stay a create: it becomes an update (and the revision
 * guard reports a conflict if the document is not there) and a delete becomes a
 * real delete. Before any attempt the plain matrix applies, including the
 * create+delete cancellation.
 */
function resolveCoalescedOperation(
  existing: OutboxMutation,
  incoming: OutboxMutationInput,
): OutboxOperation | null {
  if (existing.operation === "create" && existing.attempts > 0) {
    return incoming.operation === "delete" ? "delete" : "update";
  }

  return COALESCE_MATRIX[existing.operation][incoming.operation];
}
