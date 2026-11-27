import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { registerCurrentOwnerResolver } from "@/shared/lib/local-db/current-owner";
import { migrateLocalDatabase } from "@/shared/lib/local-db/database";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import {
  resetLocalDatabasePort,
  setLocalDatabasePort,
} from "@/shared/lib/local-db/local-db.runtime";
import { CachedGroupExpensesRepository } from "@/features/group-expenses/repositories/cached-group-expenses.repository";
import { CachedGroupSettlementsRepository } from "@/features/group-expenses/repositories/cached-group-settlements.repository";
import { CachedSettlementsRepository } from "@/features/settlements/repositories/cached-settlements.repository";
import { CachedSharedExpensesRepository } from "@/features/shared-expenses/repositories/cached-shared-expenses.repository";
import { buildGroupExpense } from "@/features/group-expenses/utils/__tests__/group-expense.fixtures";
import { buildGroupSettlement } from "@/features/group-expenses/services/__tests__/group-settlements-service.fakes";
import { buildSettlement } from "@/features/settlements/utils/__tests__/settlement.fixtures";
import { buildSharedExpense } from "@/features/shared-expenses/utils/__tests__/shared-expense.fixtures";
import { toGroupExpenseLocalRow } from "@/features/group-expenses/repositories/local-group-expense.mapper";
import { toGroupSettlementLocalRow } from "@/features/group-expenses/repositories/local-group-settlement.mapper";
import { toSettlementLocalRow } from "@/features/settlements/repositories/local-settlement.mapper";
import { toSharedExpenseLocalRow } from "@/features/shared-expenses/repositories/local-shared-expense.mapper";

const OWNER = "user-a";
const NOW = "2026-11-26T10:00:00.000Z";

let db: InMemoryDatabase;

function sharedRemote() {
  return {
    getExpense: jest.fn(async (id: string) => (id === "expense-1" ? buildSharedExpense() : null)),
    getExpenses: jest.fn(async () => [buildSharedExpense()]),
    createExpense: jest.fn(async () => buildSharedExpense()),
    createExpenseLink: jest.fn(async () => buildSharedExpense()),
    updateExpense: jest.fn(async () => buildSharedExpense({ amountCents: 2000 })),
    updateExpenseLink: jest.fn(async () => buildSharedExpense()),
    softDeleteExpense: jest.fn(async () => {}),
    softDeleteExpenseLink: jest.fn(async () => {}),
  };
}

function settlementRemote() {
  return {
    getSettlement: jest.fn(async () => buildSettlement()),
    getSettlements: jest.fn(async () => [buildSettlement()]),
    createSettlement: jest.fn(async (dto: unknown) => buildSettlement()),
    updateSettlement: jest.fn(async () => buildSettlement()),
    softDeleteSettlement: jest.fn(async () => {}),
  };
}

function groupExpenseRemote() {
  return {
    getExpense: jest.fn(async () => buildGroupExpense()),
    getGroupExpenses: jest.fn(async () => [buildGroupExpense()]),
    createExpense: jest.fn(async () => buildGroupExpense()),
    createExpenseLink: jest.fn(async () => buildGroupExpense()),
    updateExpense: jest.fn(async () => buildGroupExpense()),
    updateExpenseLink: jest.fn(async () => buildGroupExpense()),
    softDeleteExpense: jest.fn(async () => {}),
    softDeleteExpenseLink: jest.fn(async () => {}),
  };
}

function groupSettlementRemote() {
  return {
    getGroupSettlement: jest.fn(async () => buildGroupSettlement()),
    getGroupSettlements: jest.fn(async () => [buildGroupSettlement()]),
    createGroupSettlement: jest.fn(async () => buildGroupSettlement()),
    updateGroupSettlement: jest.fn(async () => buildGroupSettlement()),
    softDeleteGroupSettlement: jest.fn(async () => {}),
  };
}

const notification = {
  userId: "user-b",
  type: "settlement-created",
  payload: {},
  dedupeKey: "dedupe",
  createdAt: NOW,
} as const;

beforeEach(async () => {
  process.env.EXPO_PUBLIC_OFFLINE_FIRST = "true";
  db = new InMemoryDatabase();
  await migrateLocalDatabase(db);
  setLocalDatabasePort(db);
  registerCurrentOwnerResolver(() => OWNER);
});

afterEach(() => {
  delete process.env.EXPO_PUBLIC_OFFLINE_FIRST;
  resetLocalDatabasePort();
  registerCurrentOwnerResolver(() => null);
});

describe("CachedSharedExpensesRepository", () => {
  it("mirrors lists and falls back to them", async () => {
    const remote = sharedRemote();
    const repository = new CachedSharedExpensesRepository(remote as never);
    await expect(repository.getExpenses(OWNER)).resolves.toHaveLength(1);

    remote.getExpenses.mockRejectedValueOnce(new Error("offline"));
    await expect(repository.getExpenses(OWNER)).resolves.toHaveLength(1);
  });

  it("keeps an expense created offline visible after the remote list", async () => {
    const remote = sharedRemote();
    const repository = new CachedSharedExpensesRepository(remote as never);
    const pending = buildSharedExpense({ id: "local-expense" });
    await db.upsert(
      "sharedExpenses",
      toSharedExpenseLocalRow(pending, OWNER, "pending"),
    );

    const expenses = await repository.getExpenses(OWNER);

    expect(expenses.map((expense) => expense.id)).toEqual(
      expect.arrayContaining(["expense-1", "local-expense"]),
    );
  });

  it("mirrors one expense and falls back to the cached copy", async () => {
    const remote = sharedRemote();
    const repository = new CachedSharedExpensesRepository(remote as never);
    await repository.getExpense("expense-1");

    remote.getExpense.mockRejectedValueOnce(new Error("offline"));
    await expect(repository.getExpense("expense-1")).resolves.toMatchObject({
      id: "expense-1",
    });
  });

  it("mirrors mutations and refreshes a delete", async () => {
    const remote = sharedRemote();
    const repository = new CachedSharedExpensesRepository(remote as never);

    await repository.createExpense({} as never);
    await repository.createExpenseLink({} as never);
    await repository.updateExpense("expense-1", {} as never);
    await repository.updateExpenseLink(OWNER, "expense-1", {} as never);
    await repository.softDeleteExpense("expense-1", NOW);
    await repository.softDeleteExpenseLink(OWNER, "expense-1", NOW);

    expect(remote.softDeleteExpenseLink).toHaveBeenCalled();
    await expect(repository.getExpense("missing")).resolves.toBeNull();
  });
});

describe("CachedSettlementsRepository", () => {
  it("keeps a settlement created offline visible after the remote list", async () => {
    const remote = settlementRemote();
    const repository = new CachedSettlementsRepository(remote as never);
    const pending = buildSettlement({ id: "local-settlement" });
    await db.upsert(
      "settlements",
      toSettlementLocalRow(pending, OWNER, "pending"),
    );

    const settlements = await repository.getSettlements(OWNER);

    expect(settlements.map((settlement) => settlement.id)).toEqual(
      expect.arrayContaining(["settlement-1", "local-settlement"]),
    );
  });

  it("mirrors lists, one record and mutations", async () => {
    const remote = settlementRemote();
    const repository = new CachedSettlementsRepository(remote as never);

    await repository.getSettlements(OWNER);
    await repository.getSettlement("settlement-1");
    await repository.createSettlement({} as never, () => notification);
    await repository.updateSettlement(OWNER, "settlement-1", {} as never, notification);
    await repository.softDeleteSettlement(OWNER, "settlement-1", NOW, notification);

    remote.getSettlements.mockRejectedValueOnce(new Error("offline"));
    await expect(repository.getSettlements(OWNER)).resolves.toHaveLength(1);
    remote.getSettlement.mockRejectedValueOnce(new Error("offline"));
    await expect(repository.getSettlement("settlement-1")).resolves.toMatchObject({
      id: "settlement-1",
    });
  });
});

describe("CachedGroupExpensesRepository", () => {
  it("keeps a group expense created offline visible after the remote list", async () => {
    const remote = groupExpenseRemote();
    const repository = new CachedGroupExpensesRepository(remote as never);
    const pending = buildGroupExpense({ id: "local-expense" });
    await db.upsert(
      "groupExpenses",
      toGroupExpenseLocalRow(pending, OWNER, "pending"),
    );

    const expenses = await repository.getGroupExpenses(pending.groupId);

    expect(expenses.map((expense) => expense.id)).toEqual(
      expect.arrayContaining(["expense-1", "local-expense"]),
    );
  });

  it("mirrors one group and falls back to it", async () => {
    const remote = groupExpenseRemote();
    const repository = new CachedGroupExpensesRepository(remote as never);
    const groupId = buildGroupExpense().groupId;

    await repository.getGroupExpenses(groupId);
    remote.getGroupExpenses.mockRejectedValueOnce(new Error("offline"));
    await expect(repository.getGroupExpenses(groupId)).resolves.toHaveLength(1);

    await repository.getExpense("expense-1");
    remote.getExpense.mockRejectedValueOnce(new Error("offline"));
    await expect(repository.getExpense("expense-1")).resolves.toMatchObject({
      id: "expense-1",
    });
  });

  it("mirrors mutations and refreshes a delete", async () => {
    const remote = groupExpenseRemote();
    const repository = new CachedGroupExpensesRepository(remote as never);

    await repository.createExpense({} as never);
    await repository.createExpenseLink({} as never);
    await repository.updateExpense("expense-1", {} as never, OWNER);
    await repository.updateExpenseLink(OWNER, "expense-1", {} as never);
    await repository.softDeleteExpense("expense-1", NOW, OWNER);
    await repository.softDeleteExpenseLink(OWNER, "expense-1", NOW);

    expect(remote.softDeleteExpenseLink).toHaveBeenCalled();
  });
});

describe("CachedGroupSettlementsRepository", () => {
  it("keeps a group settlement created offline visible after the remote list", async () => {
    const remote = groupSettlementRemote();
    const repository = new CachedGroupSettlementsRepository(remote as never);
    const pending = buildGroupSettlement({ id: "local-settlement" });
    await db.upsert(
      "groupSettlements",
      toGroupSettlementLocalRow(pending, OWNER, "pending"),
    );

    const settlements = await repository.getGroupSettlements(pending.groupId);

    expect(settlements.map((settlement) => settlement.id)).toEqual(
      expect.arrayContaining(["group-settlement-1", "local-settlement"]),
    );
  });

  it("mirrors lists, records and mutations", async () => {
    const remote = groupSettlementRemote();
    const repository = new CachedGroupSettlementsRepository(remote as never);
    const groupId = buildGroupSettlement().groupId;

    await repository.getGroupSettlements(groupId);
    await repository.getGroupSettlement("group-settlement-1");
    await repository.createGroupSettlement({} as never, () => notification);
    await repository.updateGroupSettlement(
      OWNER,
      "group-settlement-1",
      {} as never,
      notification,
    );
    await repository.softDeleteGroupSettlement(
      OWNER,
      "group-settlement-1",
      NOW,
      notification,
    );

    remote.getGroupSettlements.mockRejectedValueOnce(new Error("offline"));
    await expect(repository.getGroupSettlements(groupId)).resolves.toHaveLength(1);
    remote.getGroupSettlement.mockRejectedValueOnce(new Error("offline"));
    await expect(
      repository.getGroupSettlement("group-settlement-1"),
    ).resolves.toMatchObject({ id: "group-settlement-1" });
  });
});
