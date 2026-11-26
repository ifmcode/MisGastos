import { describe, expect, it } from "@jest/globals";

import { coalesceOutboxMutation } from "../outbox.coalescing";
import type { OutboxOperation } from "../local-db.types";
import { buildInput, buildMutation, LATER } from "./outbox.fixtures";

const OPERATIONS: OutboxOperation[] = ["create", "update", "delete"];

const EXPECTED = {
  create: { create: "create", update: "create", delete: null },
  update: { create: "update", update: "update", delete: "delete" },
  delete: { create: "update", update: "delete", delete: "delete" },
} as const;

describe("coalesceOutboxMutation", () => {
  it.each(OPERATIONS)(
    "coalesces an existing %s with every incoming operation",
    (existingOperation) => {
      for (const incomingOperation of OPERATIONS) {
        const result = coalesceOutboxMutation(
          buildMutation({ operation: existingOperation }),
          buildInput({ operation: incomingOperation }),
        );

        expect(result?.operation ?? null).toBe(
          EXPECTED[existingOperation][incomingOperation],
        );
      }
    },
  );

  it("keeps seq, baseRevision and createdAt with the incoming id", () => {
    const existing = buildMutation({
      clientMutationId: "old-mutation",
      seq: 7,
      baseRevision: 3,
      createdAt: "2026-11-01T00:00:00.000Z",
      operation: "update",
    });

    const result = coalesceOutboxMutation(
      existing,
      buildInput({
        clientMutationId: "new-mutation",
        operation: "update",
        now: LATER,
      }),
    );

    expect(result).toMatchObject({
      clientMutationId: "new-mutation",
      seq: 7,
      baseRevision: 3,
      operation: "update",
      createdAt: "2026-11-01T00:00:00.000Z",
      updatedAt: LATER,
    });
  });

  it("keeps the identity of the entity from the existing row", () => {
    const result = coalesceOutboxMutation(
      buildMutation({ ownerId: "owner-1", entityId: "tx-1" }),
      buildInput({ ownerId: "owner-2", entityId: "tx-2" }),
    );

    expect(result).toMatchObject({
      ownerId: "owner-1",
      entityType: "transaction",
      entityId: "tx-1",
    });
  });

  it("turns an attempted create into an update or a delete", () => {
    const attempted = buildMutation({ operation: "create", attempts: 1 });

    expect(
      coalesceOutboxMutation(attempted, buildInput({ operation: "update" }))
        ?.operation,
    ).toBe("update");
    expect(
      coalesceOutboxMutation(attempted, buildInput({ operation: "delete" }))
        ?.operation,
    ).toBe("delete");
  });

  it("still cancels an unattempted create followed by a delete", () => {
    expect(
      coalesceOutboxMutation(
        buildMutation({ operation: "create", attempts: 0 }),
        buildInput({ operation: "delete" }),
      ),
    ).toBeNull();
  });
});
