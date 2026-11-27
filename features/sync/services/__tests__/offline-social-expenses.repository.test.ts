import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { migrateLocalDatabase } from "@/shared/lib/local-db/database";
import { registerCurrentOwnerResolver } from "@/shared/lib/local-db/current-owner";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import { LocalOutboxRepository } from "@/shared/lib/local-db/local-outbox.repository";
import type { LocalRow } from "@/shared/lib/local-db/local-db.types";
import type { GroupExpense } from "@/features/group-expenses/types/group-expense.types";
import type { SharedExpense } from "@/features/shared-expenses/types/shared-expense.types";
import { OfflineGroupExpensesRepository } from "@/features/group-expenses/repositories/offline-group-expenses.repository";
import {
  fromGroupExpenseLocalRow,
  toGroupExpenseLocalRow,
} from "@/features/group-expenses/repositories/local-group-expense.mapper";
import { OfflineSharedExpensesRepository } from "@/features/shared-expenses/repositories/offline-shared-expenses.repository";
import {
  fromSharedExpenseLocalRow,
  toSharedExpenseLocalRow,
} from "@/features/shared-expenses/repositories/local-shared-expense.mapper";
import { buildGroupExpense } from "@/features/group-expenses/utils/__tests__/group-expense.fixtures";
import { buildSharedExpense } from "@/features/shared-expenses/utils/__tests__/shared-expense.fixtures";

const OWNER = "user-a";
const NOW = "2026-11-26T10:00:00.000Z";

function splitShared(expense: SharedExpense) {
  const { id: _id, revision: _revision, ...dto } = expense;
  return dto;
}

function splitGroup(expense: GroupExpense) {
  const { id: _id, revision: _revision, ...dto } = expense;
  return dto;
}

function sharedRemote() {
  return {
    getExpense: jest.fn(async (_id: string) => null),
    getExpenses: jest.fn(async (_owner: string) => []),
    createExpense: jest.fn(async (_dto: unknown) => buildSharedExpense()),
    createExpenseLink: jest.fn(async (_dto: unknown) => buildSharedExpense()),
    updateExpense: jest.fn(async (_id: string, _update: unknown) =>
      buildSharedExpense(),
    ),
    updateExpenseLink: jest.fn(
      async (_viewer: string, _id: string, _update: unknown) =>
        buildSharedExpense(),
    ),
    softDeleteExpense: jest.fn(async (_id: string, _deletedAt: string) => {}),
    softDeleteExpenseLink: jest.fn(
      async (_viewer: string, _id: string, _deletedAt: string) => {},
    ),
  };
}

function groupRemote() {
  return {
    getExpense: jest.fn(async (_id: string) => null),
    getGroupExpenses: jest.fn(async (_groupId: string) => []),
    createExpense: jest.fn(async (_dto: unknown) => buildGroupExpense()),
    createExpenseLink: jest.fn(async (_dto: unknown) => buildGroupExpense()),
    updateExpense: jest.fn(
      async (_id: string, _update: unknown, _viewer: string) =>
        buildGroupExpense(),
    ),
    updateExpenseLink: jest.fn(
      async (_viewer: string, _id: string, _update: unknown) =>
        buildGroupExpense(),
    ),
    softDeleteExpense: jest.fn(
      async (_id: string, _deletedAt: string, _viewer: string) => {},
    ),
    softDeleteExpenseLink: jest.fn(
      async (_viewer: string, _id: string, _deletedAt: string) => {},
    ),
  };
}

function options(db: InMemoryDatabase) {
  let counter = 0;
  return {
    getPort: async () => db,
    now: () => NOW,
    createId: () => `id-${++counter}`,
  };
}

async function outboxRows(db: InMemoryDatabase) {
  return new LocalOutboxRepository(db).listByOwner(OWNER);
}

async function seed(db: InMemoryDatabase, table: "sharedExpenses" | "groupExpenses", row: LocalRow) {
  await db.upsert(table, row);
}

beforeEach(async () => {
  registerCurrentOwnerResolver(() => OWNER);
});

afterEach(() => {
  registerCurrentOwnerResolver(() => null);
});

describe("OfflineSharedExpensesRepository", () => {
  let db: InMemoryDatabase;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
  });

  it("creates the local row and its outbox create", async () => {
    const repository = new OfflineSharedExpensesRepository(
      sharedRemote() as never,
      options(db),
    );

    const expense = await repository.createExpense(
      splitShared(buildSharedExpense()) as never,
    );

    expect(expense).toMatchObject({ id: "id-1", revision: 0 });
    const row = await db.select<LocalRow>("sharedExpenses", {
      where: { id: "id-1" },
    });
    expect(row[0]).toMatchObject({ ownerId: OWNER, syncStatus: "pending" });
    expect(await outboxRows(db)).toMatchObject([
      { operation: "create", entityType: "shared-expense", baseRevision: 0 },
    ]);
  });

  it("updates a cached expense with its server snapshot", async () => {
    await seed(
      db,
      "sharedExpenses",
      toSharedExpenseLocalRow(buildSharedExpense(), OWNER),
    );
    const repository = new OfflineSharedExpensesRepository(
      sharedRemote() as never,
      options(db),
    );

    await repository.updateExpense("expense-1", {
      payerId: "user-a",
      amountCents: 2000,
      currency: "EUR",
      splitMode: "equal",
      participants: [
        { userId: "user-a", shareCents: 1000 },
        { userId: "user-b", shareCents: 1000 },
      ],
      description: "Lunch",
      date: "2026-11-11",
      walletId: null,
      categoryId: null,
      updatedAt: NOW,
    });

    const row = await db.select<LocalRow>("sharedExpenses", {
      where: { id: "expense-1", ownerId: OWNER },
    });
    expect(fromSharedExpenseLocalRow(row[0])).toMatchObject({
      amountCents: 2000,
      revision: 0,
    });
    expect(await outboxRows(db)).toMatchObject([
      {
        operation: "update",
        entityType: "shared-expense",
        baseRevision: 0,
        serverSnapshot: { amountCents: 1000 },
      },
    ]);
  });

  it("soft-deletes a cached expense", async () => {
    await seed(
      db,
      "sharedExpenses",
      toSharedExpenseLocalRow(buildSharedExpense(), OWNER),
    );
    const repository = new OfflineSharedExpensesRepository(
      sharedRemote() as never,
      options(db),
    );

    await repository.softDeleteExpense("expense-1", NOW);

    const row = await db.select<LocalRow>("sharedExpenses", {
      where: { id: "expense-1", ownerId: OWNER },
    });
    expect(fromSharedExpenseLocalRow(row[0])?.deletedAt).toBe(NOW);
    expect(await outboxRows(db)).toMatchObject([
      { operation: "delete", entityType: "shared-expense" },
    ]);
  });

  it("cancels an unsent create when it is deleted", async () => {
    const repository = new OfflineSharedExpensesRepository(
      sharedRemote() as never,
      options(db),
    );
    await repository.createExpense(splitShared(buildSharedExpense()) as never);

    await repository.softDeleteExpense("id-1", NOW);

    await expect(
      db.select<LocalRow>("sharedExpenses", { where: { id: "id-1" } }),
    ).resolves.toHaveLength(0);
    await expect(outboxRows(db)).resolves.toHaveLength(0);
  });

  it("delegates when the record is not cached", async () => {
    const remote = sharedRemote();
    const repository = new OfflineSharedExpensesRepository(
      remote as never,
      options(db),
    );

    await repository.updateExpense("external", {
      payerId: "user-a",
      amountCents: 1000,
      currency: "EUR",
      splitMode: "equal",
      participants: [],
      description: "Dinner",
      date: "2026-11-10",
      walletId: null,
      categoryId: null,
      updatedAt: NOW,
    });

    expect(remote.updateExpense).toHaveBeenCalledWith("external", expect.anything());
    expect(await outboxRows(db)).toHaveLength(0);
  });

  it("delegates when there is no local port", async () => {
    const remote = sharedRemote();
    const repository = new OfflineSharedExpensesRepository(remote as never, {
      getPort: async () => null,
    });

    await repository.createExpense({} as never);
    await repository.createExpenseLink({} as never);
    await repository.updateExpense("expense-1", {} as never);
    await repository.updateExpenseLink(OWNER, "expense-1", {} as never);
    await repository.softDeleteExpense("expense-1", NOW);
    await repository.softDeleteExpenseLink(OWNER, "expense-1", NOW);

    expect(remote.createExpense).toHaveBeenCalled();
    expect(remote.createExpenseLink).toHaveBeenCalled();
    expect(remote.softDeleteExpenseLink).toHaveBeenCalled();
  });

  it("round-trips the local mapper", () => {
    const expense = buildSharedExpense({ revision: 3 });
    const row = toSharedExpenseLocalRow(expense, OWNER);

    expect(fromSharedExpenseLocalRow(row)).toEqual(expense);
  });

  it("drops a malformed local row", () => {
    expect(fromSharedExpenseLocalRow({ id: "", ownerId: OWNER })).toBeNull();
  });
});

describe("OfflineGroupExpensesRepository", () => {
  let db: InMemoryDatabase;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
  });

  it("creates the local row and its outbox create", async () => {
    const repository = new OfflineGroupExpensesRepository(
      groupRemote() as never,
      options(db),
    );

    const expense = await repository.createExpense(
      splitGroup(buildGroupExpense()) as never,
    );

    expect(expense).toMatchObject({ id: "id-1", revision: 0 });
    expect(await outboxRows(db)).toMatchObject([
      { operation: "create", entityType: "group-expense" },
    ]);
  });

  it("updates and deletes a cached expense", async () => {
    await seed(db, "groupExpenses", toGroupExpenseLocalRow(buildGroupExpense(), OWNER));
    const repository = new OfflineGroupExpensesRepository(
      groupRemote() as never,
      options(db),
    );

    await repository.updateExpense(
      "expense-1",
      {
        payerId: "user-a",
        amountCents: 2000,
        currency: "EUR",
        splitMode: "equal",
        participants: [
          { userId: "user-a", shareCents: 1000 },
          { userId: "user-b", shareCents: 1000 },
        ],
        description: "Lunch",
        date: "2026-11-11",
        walletId: null,
        categoryId: null,
        updatedAt: NOW,
      },
      OWNER,
    );
    await repository.softDeleteExpense("expense-1", NOW, OWNER);

    expect(await outboxRows(db)).toMatchObject([
      { operation: "delete", entityType: "group-expense" },
    ]);
  });

  it("delegates when there is no local port", async () => {
    const remote = groupRemote();
    const repository = new OfflineGroupExpensesRepository(remote as never, {
      getPort: async () => null,
    });

    await repository.createExpense({} as never);
    await repository.createExpenseLink({} as never);
    await repository.updateExpense("expense-1", {} as never, OWNER);
    await repository.updateExpenseLink(OWNER, "expense-1", {} as never);
    await repository.softDeleteExpense("expense-1", NOW, OWNER);
    await repository.softDeleteExpenseLink(OWNER, "expense-1", NOW);

    expect(remote.createExpense).toHaveBeenCalled();
    expect(remote.softDeleteExpenseLink).toHaveBeenCalled();
  });

  it("round-trips the local mapper", () => {
    const expense = buildGroupExpense({ revision: 2 });
    expect(
      fromGroupExpenseLocalRow(toGroupExpenseLocalRow(expense, OWNER)),
    ).toEqual(expense);
  });
});
