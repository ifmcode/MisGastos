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
 * Merges a queued mutation with a newer one for the same record. One outbox
 * row per entity: the identity, `seq` and `baseRevision` (the revision the
 * server knows) are kept, the local snapshot is the newest one, the dependency
 * guard survives when the edit omits it, and the retry state restarts.
 */
export function coalesceOutboxMutation(
  existing: OutboxMutation,
  incoming: OutboxMutationInput,
): OutboxMutation | null {
  const operation = COALESCE_MATRIX[existing.operation][incoming.operation];

  if (operation === null) return null;

  return {
    clientMutationId: existing.clientMutationId,
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
