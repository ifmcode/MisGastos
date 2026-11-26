import type {
  LocalConflict,
  OutboxMutation,
} from "@/shared/lib/local-db/local-db.types";

export const NOW = "2026-11-26T10:00:00.000Z";

export function buildConflict(
  overrides: Partial<LocalConflict> = {},
): LocalConflict {
  return {
    id: "owner-1__mutation-1",
    ownerId: "owner-1",
    clientMutationId: "mutation-1",
    entityType: "transaction",
    entityId: "tx-1",
    kind: "REMOTE_CHANGED",
    localSnapshot: { id: "tx-1", amount: 25 },
    remoteSnapshot: { id: "tx-1", amount: 30, revision: 4 },
    detectedAt: NOW,
    resolvedAt: null,
    resolution: null,
    ...overrides,
  };
}

export function buildMutation(
  overrides: Partial<OutboxMutation> = {},
): OutboxMutation {
  return {
    clientMutationId: "mutation-1",
    ownerId: "owner-1",
    seq: 1,
    entityType: "transaction",
    entityId: "tx-1",
    operation: "update",
    baseRevision: 2,
    localSnapshot: { id: "tx-1", amount: 25 },
    serverSnapshot: { id: "tx-1", amount: 20, revision: 2 },
    dependsOn: [],
    status: "conflict",
    attempts: 1,
    nextAttemptAt: null,
    lastErrorCode: "SYNC_REMOTE_CHANGED",
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}
