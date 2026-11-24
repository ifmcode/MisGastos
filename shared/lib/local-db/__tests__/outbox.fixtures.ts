import type {
  OutboxMutation,
  OutboxMutationInput,
} from "../local-db.types";

export const NOW = "2026-11-20T10:00:00.000Z";
export const LATER = "2026-11-20T10:05:00.000Z";

export function buildMutation(
  overrides: Partial<OutboxMutation> = {},
): OutboxMutation {
  return {
    clientMutationId: "mutation-1",
    ownerId: "owner-1",
    seq: 1,
    entityType: "transaction",
    entityId: "tx-1",
    operation: "create",
    baseRevision: 0,
    localSnapshot: { amount: 10 },
    serverSnapshot: {},
    dependsOn: [],
    status: "pending",
    attempts: 0,
    nextAttemptAt: null,
    lastErrorCode: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function buildInput(
  overrides: Partial<OutboxMutationInput> = {},
): OutboxMutationInput {
  return {
    clientMutationId: "mutation-1",
    ownerId: "owner-1",
    entityType: "transaction",
    entityId: "tx-1",
    operation: "create",
    baseRevision: 0,
    localSnapshot: { amount: 10 },
    now: NOW,
    ...overrides,
  };
}
