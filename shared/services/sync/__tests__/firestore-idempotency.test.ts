import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { SyncMutationError } from "../sync.errors";

const mockDoc = jest.fn<(...args: unknown[]) => unknown>();

jest.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
}));

jest.mock("@/lib/firebase", () => ({ db: { name: "test-db" } }));

import {
  appliedMutationId,
  appliedMutationRef,
  assertExpectedRevision,
  readAppliedRevision,
  writeAppliedMutation,
} from "../firestore-idempotency";

const markerRef = { kind: "marker", id: "owner-1__m1" };
const context = { clientMutationId: "m1", baseRevision: 2 };

function snapshot(exists: boolean, data?: Record<string, unknown>) {
  return { exists: () => exists, data: () => data };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockDoc.mockReturnValue(markerRef);
});

describe("appliedMutationId", () => {
  it("is deterministic per owner and mutation", () => {
    expect(appliedMutationId("owner-1", "m1")).toBe("owner-1__m1");
  });
});

describe("appliedMutationRef", () => {
  it("points at the appliedMutations collection", () => {
    expect(appliedMutationRef("owner-1", "m1")).toBe(markerRef);
    expect(mockDoc).toHaveBeenCalledWith(
      { name: "test-db" },
      "appliedMutations",
      "owner-1__m1",
    );
  });
});

describe("readAppliedRevision", () => {
  it("returns null when the marker does not exist", async () => {
    const transaction = { get: jest.fn(async () => snapshot(false)) };

    await expect(
      readAppliedRevision(transaction as never, "owner-1", context),
    ).resolves.toBeNull();
  });

  it("returns the revision stored by the previous apply", async () => {
    const transaction = {
      get: jest.fn(async () => snapshot(true, { revisionAfter: 5 })),
    };

    await expect(
      readAppliedRevision(transaction as never, "owner-1", context),
    ).resolves.toBe(5);
  });

  it("degrades a malformed marker to revision 0", async () => {
    const transaction = {
      get: jest.fn(async () => snapshot(true, { revisionAfter: "nope" })),
    };

    await expect(
      readAppliedRevision(transaction as never, "owner-1", context),
    ).resolves.toBe(0);
  });
});

describe("assertExpectedRevision", () => {
  it("accepts the revision the local mutation was based on", () => {
    expect(() =>
      assertExpectedRevision({ revision: 2 }, context),
    ).not.toThrow();
  });

  it("treats a legacy document without revision as revision 0", () => {
    expect(() =>
      assertExpectedRevision({}, { clientMutationId: "m1", baseRevision: 0 }),
    ).not.toThrow();
  });

  it("throws a REMOTE_CHANGED conflict when another device edited it", () => {
    expect(() => assertExpectedRevision({ revision: 3 }, context)).toThrow(
      SyncMutationError,
    );

    try {
      assertExpectedRevision({ revision: 3 }, context);
    } catch (error) {
      expect(error).toMatchObject({ kind: "REMOTE_CHANGED" });
    }
  });
});

describe("writeAppliedMutation", () => {
  it("writes the append-only marker with its final revision", () => {
    const transaction = { set: jest.fn() };

    writeAppliedMutation(transaction as never, {
      ownerId: "owner-1",
      context,
      entityType: "transaction",
      entityId: "tx-1",
      revisionAfter: 3,
      now: "2026-11-26T10:00:00.000Z",
    });

    expect(transaction.set).toHaveBeenCalledWith(markerRef, {
      ownerId: "owner-1",
      clientMutationId: "m1",
      entityType: "transaction",
      entityId: "tx-1",
      revisionAfter: 3,
      appliedAt: "2026-11-26T10:00:00.000Z",
    });
  });
});
