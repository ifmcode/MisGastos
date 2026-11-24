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

  it("keeps the existing id, seq, baseRevision and createdAt", () => {
    const existing = buildMutation({
      clientMutationId: "keep-me",
      seq: 7,
      baseRevision: 3,
      createdAt: "2026-11-01T00:00:00.000Z",
      operation: "update",
    });

    const result = coalesceOutboxMutation(
      existing,
      buildInput({ operation: "update", now: LATER }),
    );

    expect(result).toMatchObject({
      clientMutationId: "keep-me",
      seq: 7,
      baseRevision: 3,
      operation: "update",
      createdAt: "2026-11-01T00:00:00.000Z",
      updatedAt: LATER,
    });
  });

  it("takes the identity from the existing row", () => {
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
});
