import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGet = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockSet = jest.fn();
const mockUpdate = jest.fn();

jest.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => ({
    id: String(args[2] ?? args[1]),
    path: String(args[1]),
  }),
  collection: () => ({ path: "collection" }),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  runTransaction: async (
    _db: unknown,
    callback: (tx: unknown) => Promise<unknown>,
  ) => callback({ get: mockGet, set: mockSet, update: mockUpdate }),
}));
jest.mock("@/lib/firebase", () => ({ db: {} }));
jest.mock("@/shared/services/sync/firestore-idempotency", () => ({
  readAppliedRevision: jest.fn(async () => null),
  writeAppliedMutation: jest.fn(),
  assertExpectedRevision: jest.fn(),
}));

import {
  readAppliedRevision,
  writeAppliedMutation,
} from "@/shared/services/sync/firestore-idempotency";
import { buildExpenseDocument, buildUpdateExpenseDto } from "@/features/shared-expenses/repositories/__tests__/shared-expense-document.fixtures";
import {
  createSharedExpenseOperation,
  softDeleteSharedExpenseOperation,
  updateSharedExpenseOperation,
} from "@/features/shared-expenses/repositories/shared-expenses.operations";

const sync = { clientMutationId: "m-1", baseRevision: 0, ownerId: "user-a" };

function snapshot(data: Record<string, unknown> | null) {
  return { id: "expense-1", exists: () => data !== null, data: () => data ?? undefined };
}

beforeEach(() => {
  jest.clearAllMocks();
  (readAppliedRevision as unknown as { mockImplementation: (fn: () => Promise<unknown>) => void }).mockImplementation(async () => null);
});

describe("shared expense sync branches", () => {
  it("creates inside a transaction and writes the marker", async () => {
    mockGet.mockResolvedValue(snapshot(null));

    const result = await createSharedExpenseOperation(
      buildExpenseDocument() as never,
      { id: "expense-1", sync: sync as never },
    );

    expect(mockSet).toHaveBeenCalled();
    expect(writeAppliedMutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ entityType: "shared-expense" }),
    );
    expect(result.id).toBe("expense-1");
  });

  it("returns the stored record on a replay", async () => {
    jest.mocked(readAppliedRevision).mockResolvedValue(2);
    mockGet.mockResolvedValue(snapshot(buildExpenseDocument()));

    const result = await createSharedExpenseOperation(
      buildExpenseDocument() as never,
      { id: "expense-1", sync: sync as never },
    );

    expect(result.id).toBe("expense-1");
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("updates with the revision bump and the marker", async () => {
    mockGet.mockResolvedValue(snapshot(buildExpenseDocument()));

    const result = await updateSharedExpenseOperation(
      "expense-1",
      buildUpdateExpenseDto(),
      { sync: sync as never },
    );

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ revision: 1 }),
    );
    expect(result.revision).toBe(1);
  });

  it("reports a remote delete as a conflict", async () => {
    mockGet.mockResolvedValue(snapshot(null));

    await expect(
      updateSharedExpenseOperation("expense-1", buildUpdateExpenseDto(), {
        sync: sync as never,
      }),
    ).rejects.toMatchObject({ kind: "DELETED_REMOTELY" });
  });

  it("reports an already deleted remote as a conflict", async () => {
    mockGet.mockResolvedValue(
      snapshot(buildExpenseDocument({ deletedAt: "2026-11-20T10:00:00.000Z" })),
    );

    await expect(
      updateSharedExpenseOperation("expense-1", buildUpdateExpenseDto(), {
        sync: sync as never,
      }),
    ).rejects.toMatchObject({ kind: "DELETED_REMOTELY" });
  });

  it("deletes idempotently and writes the marker", async () => {
    mockGet.mockResolvedValue(
      snapshot(buildExpenseDocument({ deletedAt: "2026-11-20T10:00:00.000Z" })),
    );

    await softDeleteSharedExpenseOperation("expense-1", "2026-11-20T10:00:00.000Z", {
      sync: sync as never,
    });

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(writeAppliedMutation).toHaveBeenCalled();
  });

  it("stamps the revision on a real delete", async () => {
    mockGet.mockResolvedValue(snapshot(buildExpenseDocument()));

    await softDeleteSharedExpenseOperation("expense-1", "2026-11-20T10:00:00.000Z", {
      sync: sync as never,
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ revision: 1 }),
    );
  });
});
