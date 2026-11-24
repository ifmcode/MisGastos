import { describe, expect, it } from "@jest/globals";

import {
  buildOutboxMutation,
  coalesceOutboxMutation,
} from "../outbox.coalescing";
import type { OutboxMutationInput } from "../local-db.types";
import { buildInput, buildMutation, LATER, NOW } from "./outbox.fixtures";

describe("coalesceOutboxMutation payload", () => {
  it("takes the incoming snapshot and dependencies", () => {
    const dependencies = [{ entityType: "wallet" as const, entityId: "w1" }];

    const result = coalesceOutboxMutation(
      buildMutation({ serverSnapshot: { amount: 10, revision: 1 } }),
      buildInput({
        localSnapshot: { amount: 25 },
        dependsOn: dependencies,
      }),
    );

    expect(result).toMatchObject({
      localSnapshot: { amount: 25 },
      dependsOn: dependencies,
      serverSnapshot: { amount: 10, revision: 1 },
    });
  });

  it("keeps the dependency guard when the incoming edit omits it", () => {
    const dependencies = [{ entityType: "wallet" as const, entityId: "w1" }];

    const result = coalesceOutboxMutation(
      buildMutation({ dependsOn: dependencies }),
      buildInput({ operation: "update" }),
    );

    expect(result?.dependsOn).toEqual(dependencies);
  });

  it("uses the incoming serverSnapshot when provided", () => {
    const result = coalesceOutboxMutation(
      buildMutation({ serverSnapshot: { amount: 10 } }),
      buildInput({ serverSnapshot: { amount: 30 } }),
    );

    expect(result?.serverSnapshot).toEqual({ amount: 30 });
  });

  it("resets the retry state to pending", () => {
    const result = coalesceOutboxMutation(
      buildMutation({
        status: "failed",
        attempts: 4,
        nextAttemptAt: NOW,
        lastErrorCode: "PERMISSION_DENIED",
      }),
      buildInput({ now: LATER }),
    );

    expect(result).toMatchObject({
      status: "pending",
      attempts: 0,
      nextAttemptAt: null,
      lastErrorCode: null,
      updatedAt: LATER,
    });
  });
});

describe("buildOutboxMutation", () => {
  it("builds a pending mutation with the given seq and now", () => {
    const input: OutboxMutationInput = buildInput({
      serverSnapshot: { amount: 5 },
      dependsOn: [{ entityType: "category", entityId: "c1" }],
      now: NOW,
    });

    expect(buildOutboxMutation(input, 4)).toEqual({
      clientMutationId: "mutation-1",
      ownerId: "owner-1",
      seq: 4,
      entityType: "transaction",
      entityId: "tx-1",
      operation: "create",
      baseRevision: 0,
      localSnapshot: { amount: 10 },
      serverSnapshot: { amount: 5 },
      dependsOn: [{ entityType: "category", entityId: "c1" }],
      status: "pending",
      attempts: 0,
      nextAttemptAt: null,
      lastErrorCode: null,
      createdAt: NOW,
      updatedAt: NOW,
    });
  });

  it("defaults the optional fields", () => {
    const built = buildOutboxMutation(buildInput(), 1);

    expect(built.serverSnapshot).toEqual({});
    expect(built.dependsOn).toEqual([]);
    expect(built.nextAttemptAt).toBeNull();
    expect(built.lastErrorCode).toBeNull();
  });
});
