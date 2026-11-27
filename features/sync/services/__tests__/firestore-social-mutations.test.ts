import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockCreateShared = jest.fn<(...args: unknown[]) => Promise<{ revision: number }>>();
const mockCreateSharedLink = jest.fn<(...args: unknown[]) => Promise<{ revision: number }>>();
const mockUpdateShared = jest.fn<(...args: unknown[]) => Promise<{ revision: number }>>();
const mockUpdateSharedLink = jest.fn<(...args: unknown[]) => Promise<{ revision: number }>>();
const mockDeleteShared = jest.fn();
const mockDeleteSharedLink = jest.fn();
const mockCreateSettlement = jest.fn<(...args: unknown[]) => Promise<{ revision: number }>>();
const mockUpdateSettlement = jest.fn<(...args: unknown[]) => Promise<{ revision: number }>>();
const mockDeleteSettlement = jest.fn();
const mockCreateGroupExpense = jest.fn<(...args: unknown[]) => Promise<{ revision: number }>>();
const mockCreateGroupExpenseLink = jest.fn<(...args: unknown[]) => Promise<{ revision: number }>>();
const mockUpdateGroupExpense = jest.fn<(...args: unknown[]) => Promise<{ revision: number }>>();
const mockUpdateGroupExpenseLink = jest.fn<(...args: unknown[]) => Promise<{ revision: number }>>();
const mockDeleteGroupExpense = jest.fn();
const mockDeleteGroupExpenseLink = jest.fn();
const mockCreateGroupSettlement = jest.fn<(...args: unknown[]) => Promise<{ revision: number }>>();
const mockUpdateGroupSettlement = jest.fn<(...args: unknown[]) => Promise<{ revision: number }>>();
const mockDeleteGroupSettlement = jest.fn();

jest.mock("@/lib/firebase", () => ({ db: {} }));
jest.mock("@/features/shared-expenses/repositories/shared-expenses.operations", () => ({
  createSharedExpenseOperation: (...args: unknown[]) => mockCreateShared(...args),
  updateSharedExpenseOperation: (...args: unknown[]) => mockUpdateShared(...args),
  softDeleteSharedExpenseOperation: (...args: unknown[]) => mockDeleteShared(...args),
}));
jest.mock("@/features/shared-expenses/repositories/shared-expense-link.operations", () => ({
  createSharedExpenseLinkOperation: (...args: unknown[]) => mockCreateSharedLink(...args),
  updateSharedExpenseLinkOperation: (...args: unknown[]) => mockUpdateSharedLink(...args),
  softDeleteSharedExpenseLinkOperation: (...args: unknown[]) => mockDeleteSharedLink(...args),
}));
jest.mock("@/features/settlements/repositories/settlement-create.operation", () => ({
  createSettlementOperation: (...args: unknown[]) => mockCreateSettlement(...args),
}));
jest.mock("@/features/settlements/repositories/settlement-update.operation", () => ({
  updateSettlementOperation: (...args: unknown[]) => mockUpdateSettlement(...args),
}));
jest.mock("@/features/settlements/repositories/settlement-delete.operation", () => ({
  softDeleteSettlementOperation: (...args: unknown[]) => mockDeleteSettlement(...args),
}));
jest.mock("@/features/group-expenses/repositories/group-expenses.operations", () => ({
  createGroupExpenseOperation: (...args: unknown[]) => mockCreateGroupExpense(...args),
  updateGroupExpenseOperation: (...args: unknown[]) => mockUpdateGroupExpense(...args),
}));
jest.mock("@/features/group-expenses/repositories/group-expense-link.operations", () => ({
  createGroupExpenseLinkOperation: (...args: unknown[]) => mockCreateGroupExpenseLink(...args),
  updateGroupExpenseLinkOperation: (...args: unknown[]) => mockUpdateGroupExpenseLink(...args),
  softDeleteGroupExpenseLinkOperation: (...args: unknown[]) => mockDeleteGroupExpenseLink(...args),
}));
jest.mock("@/features/group-expenses/repositories/group-expense-delete.operation", () => ({
  softDeleteGroupExpenseOperation: (...args: unknown[]) => mockDeleteGroupExpense(...args),
}));
jest.mock("@/features/group-expenses/repositories/group-settlement-create.operation", () => ({
  createGroupSettlementOperation: (...args: unknown[]) => mockCreateGroupSettlement(...args),
}));
jest.mock("@/features/group-expenses/repositories/group-settlement-update.operation", () => ({
  updateGroupSettlementOperation: (...args: unknown[]) => mockUpdateGroupSettlement(...args),
}));
jest.mock("@/features/group-expenses/repositories/group-settlement-delete.operation", () => ({
  softDeleteGroupSettlementOperation: (...args: unknown[]) => mockDeleteGroupSettlement(...args),
}));

import type { OutboxMutation } from "@/shared/lib/local-db/local-db.types";
import { executeGroupExpenseMutation } from "../firestore-group-expense-mutations";
import { executeGroupSettlementMutation } from "../firestore-group-settlement-mutations";
import { executeSettlementMutation } from "../firestore-settlement-mutations";
import { executeSharedExpenseMutation } from "../firestore-shared-expense-mutations";
import { buildGroupExpense } from "@/features/group-expenses/utils/__tests__/group-expense.fixtures";
import { buildGroupSettlement } from "@/features/group-expenses/services/__tests__/group-settlements-service.fakes";
import { buildSettlement } from "@/features/settlements/utils/__tests__/settlement.fixtures";
import { buildSharedExpense } from "@/features/shared-expenses/utils/__tests__/shared-expense.fixtures";

const NOW = "2026-11-26T10:00:00.000Z";

const notification = {
  userId: "user-b",
  type: "settlement-created",
  payload: {},
  dedupeKey: "dedupe",
  createdAt: NOW,
};

function mutation(
  entityType: OutboxMutation["entityType"],
  snapshot: object,
  overrides: Partial<OutboxMutation> = {},
): OutboxMutation {
  return {
    clientMutationId: "mutation-1",
    ownerId: "user-a",
    seq: 1,
    entityType,
    entityId: "entity-1",
    operation: "create",
    baseRevision: 0,
    localSnapshot: { ...(snapshot as Record<string, unknown>), notification },
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

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateShared.mockResolvedValue({ revision: 0 });
  mockCreateSharedLink.mockResolvedValue({ revision: 0 });
  mockUpdateShared.mockResolvedValue({ revision: 3 });
  mockUpdateSharedLink.mockResolvedValue({ revision: 4 });
  mockCreateSettlement.mockResolvedValue({ revision: 0 });
  mockUpdateSettlement.mockResolvedValue({ revision: 2 });
  mockCreateGroupExpense.mockResolvedValue({ revision: 0 });
  mockCreateGroupExpenseLink.mockResolvedValue({ revision: 0 });
  mockUpdateGroupExpense.mockResolvedValue({ revision: 1 });
  mockUpdateGroupExpenseLink.mockResolvedValue({ revision: 1 });
  mockCreateGroupSettlement.mockResolvedValue({ revision: 0 });
  mockUpdateGroupSettlement.mockResolvedValue({ revision: 1 });
});

describe("executeSharedExpenseMutation", () => {
  it("creates a social-only expense with the client id and sync context", async () => {
    const result = await executeSharedExpenseMutation(
      mutation("shared-expense", buildSharedExpense({ revision: 0 })),
    );

    expect(mockCreateShared).toHaveBeenCalledWith(
      expect.objectContaining({ pairId: "user-a__user-b" }),
      expect.objectContaining({
        id: "entity-1",
        sync: expect.objectContaining({ ownerId: "user-a" }),
      }),
    );
    expect(result).toEqual({ status: "applied", revisionAfter: 0, wallets: [] });
  });

  it("routes a linked create through the link operation", async () => {
    await executeSharedExpenseMutation(
      mutation("shared-expense", buildSharedExpense({ walletId: "w-1" })),
    );

    expect(mockCreateSharedLink).toHaveBeenCalled();
    expect(mockCreateShared).not.toHaveBeenCalled();
  });

  it("updates and deletes through the link operation", async () => {
    await executeSharedExpenseMutation(
      mutation("shared-expense", buildSharedExpense(), { operation: "update" }),
    );
    expect(mockUpdateSharedLink).toHaveBeenCalled();
    await executeSharedExpenseMutation(
      mutation("shared-expense", buildSharedExpense(), {
        operation: "delete",
        serverSnapshot: { ...buildSharedExpense({ revision: 2 }) },
      }),
    );
    expect(mockDeleteSharedLink).toHaveBeenCalled();
  });
});

describe("executeSettlementMutation", () => {
  it("replays the stored notification", async () => {
    await executeSettlementMutation(
      mutation("settlement", buildSettlement()),
    );

    const builder = mockCreateSettlement.mock.calls[0][1] as () => unknown;
    expect(builder()).toEqual(notification);
  });

  it("updates and deletes with the stored notification", async () => {
    await executeSettlementMutation(
      mutation("settlement", buildSettlement(), { operation: "update" }),
    );
    await executeSettlementMutation(
      mutation("settlement", buildSettlement(), { operation: "delete" }),
    );

    expect(mockUpdateSettlement).toHaveBeenCalledWith(
      expect.objectContaining({ notification }),
    );
    expect(mockDeleteSettlement).toHaveBeenCalledWith(
      expect.objectContaining({ notification }),
    );
  });
});

describe("executeGroupExpenseMutation", () => {
  it("creates, routes linked records and deletes", async () => {
    await executeGroupExpenseMutation(
      mutation("group-expense", buildGroupExpense()),
    );
    await executeGroupExpenseMutation(
      mutation("group-expense", buildGroupExpense({ walletId: "w-1" })),
    );
    await executeGroupExpenseMutation(
      mutation("group-expense", buildGroupExpense(), { operation: "update" }),
    );
    await executeGroupExpenseMutation(
      mutation("group-expense", buildGroupExpense(), { operation: "delete" }),
    );

    expect(mockCreateGroupExpense).toHaveBeenCalled();
    expect(mockCreateGroupExpenseLink).toHaveBeenCalled();
    expect(mockUpdateGroupExpenseLink).toHaveBeenCalled();
    expect(mockDeleteGroupExpenseLink).toHaveBeenCalled();
  });
});

describe("executeGroupSettlementMutation", () => {
  it("creates, updates and deletes with the stored notification", async () => {
    await executeGroupSettlementMutation(
      mutation("group-settlement", buildGroupSettlement()),
    );
    await executeGroupSettlementMutation(
      mutation("group-settlement", buildGroupSettlement(), { operation: "update" }),
    );
    await executeGroupSettlementMutation(
      mutation("group-settlement", buildGroupSettlement(), { operation: "delete" }),
    );

    expect(mockCreateGroupSettlement).toHaveBeenCalled();
    expect(mockUpdateGroupSettlement).toHaveBeenCalled();
    expect(mockDeleteGroupSettlement).toHaveBeenCalled();
  });
});
