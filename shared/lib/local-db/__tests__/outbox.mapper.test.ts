import { describe, expect, it } from "@jest/globals";

import { outboxMutationFromRow, outboxMutationToRow } from "../outbox.mapper";
import { buildMutation, LATER } from "./outbox.fixtures";

describe("outbox mapper", () => {
  it("round-trips a mutation through its row", () => {
    const mutation = buildMutation({
      operation: "update",
      baseRevision: 4,
      localSnapshot: { amount: 12.5, walletId: "w1" },
      serverSnapshot: { amount: 10, revision: 4 },
      dependsOn: [{ entityType: "wallet", entityId: "w1" }],
      status: "failed",
      attempts: 2,
      nextAttemptAt: LATER,
      lastErrorCode: "UNAVAILABLE",
      updatedAt: LATER,
    });

    const row = outboxMutationToRow(mutation);

    expect(row.localSnapshot).toBe(JSON.stringify(mutation.localSnapshot));
    expect(row.serverSnapshot).toBe(JSON.stringify(mutation.serverSnapshot));
    expect(row.dependsOn).toBe(JSON.stringify(mutation.dependsOn));
    expect(outboxMutationFromRow(row)).toEqual(mutation);
  });

  it("degrades malformed snapshots to empty values", () => {
    const row = {
      ...outboxMutationToRow(buildMutation()),
      localSnapshot: "{oops",
      serverSnapshot: "5",
      dependsOn: "not-json",
    };

    const decoded = outboxMutationFromRow(row);

    expect(decoded.localSnapshot).toEqual({});
    expect(decoded.serverSnapshot).toEqual({});
    expect(decoded.dependsOn).toEqual([]);
  });

  it("treats empty strings as empty snapshots", () => {
    const row = {
      ...outboxMutationToRow(buildMutation()),
      localSnapshot: "",
      serverSnapshot: "",
      dependsOn: "",
    };

    const decoded = outboxMutationFromRow(row);

    expect(decoded.localSnapshot).toEqual({});
    expect(decoded.serverSnapshot).toEqual({});
    expect(decoded.dependsOn).toEqual([]);
  });

  it("treats a non-array dependsOn payload as empty", () => {
    const row = {
      ...outboxMutationToRow(buildMutation()),
      dependsOn: "5",
    };

    expect(outboxMutationFromRow(row).dependsOn).toEqual([]);
  });

  it("drops dependencies with an invalid shape", () => {
    const row = {
      ...outboxMutationToRow(buildMutation()),
      dependsOn: JSON.stringify([
        { entityType: "wallet", entityId: "w1" },
        { entityType: "friend", entityId: "f1" },
        { entityType: "transaction" },
        "nope",
      ]),
    };

    expect(outboxMutationFromRow(row).dependsOn).toEqual([
      { entityType: "wallet", entityId: "w1" },
    ]);
  });

  it("falls back to safe defaults for missing or unknown columns", () => {
    const decoded = outboxMutationFromRow({
      status: "unknown",
      operation: "unknown",
      entityType: "unknown",
      seq: "1",
    });

    expect(decoded).toEqual({
      clientMutationId: "",
      ownerId: "",
      seq: 0,
      entityType: "transaction",
      entityId: "",
      operation: "update",
      baseRevision: 0,
      localSnapshot: {},
      serverSnapshot: {},
      dependsOn: [],
      status: "pending",
      attempts: 0,
      nextAttemptAt: null,
      lastErrorCode: null,
      createdAt: "",
      updatedAt: "",
    });
  });
});
