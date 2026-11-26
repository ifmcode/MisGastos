import { beforeEach, describe, expect, it } from "@jest/globals";

import { migrateLocalDatabase } from "@/shared/lib/local-db/database";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import type { Transaction } from "../../types/transaction.types";
import { toTransactionLocalRow } from "../local-transaction.mapper";
import { buildTransaction } from "./local-transaction.fixtures";
import {
  createRemote,
  createRepository,
  findOutboxMutation,
  listOutbox,
  OFFLINE_OWNER,
  readTransactionRows,
  seedWallet,
} from "./offline-transaction.fixtures";

async function seedTransaction(
  db: InMemoryDatabase,
  overrides: Partial<Transaction> = {},
): Promise<void> {
  await db.upsert(
    "transactions",
    toTransactionLocalRow(
      buildTransaction({
        id: "tx-1",
        sharedExpenseId: undefined,
        groupExpenseId: undefined,
        settlementId: undefined,
        groupSettlementId: undefined,
        ownerId: OFFLINE_OWNER,
        revision: 3,
        createdAt: "2026-11-01T10:00:00.000Z",
        updatedAt: "2026-11-01T10:00:00.000Z",
        ...overrides,
      }),
    ),
  );
}

const updateDto = {
  type: "expense" as const,
  amount: 10,
  currency: "EUR" as const,
  walletId: "wallet-2",
  categoryId: "category-1",
  concept: "Editado",
  date: "2026-11-20",
};

describe("OfflineTransactionRepository update", () => {
  let db: InMemoryDatabase;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
    await seedWallet(db, { id: "wallet-1", balance: 100 });
    await seedWallet(db, { id: "wallet-2", balance: 50 });
    await seedTransaction(db);
  });

  it("keeps createdAt and the server revision while queueing an update", async () => {
    const repository = createRepository(db, createRemote());

    const result = await repository.updateTransaction(
      OFFLINE_OWNER,
      "tx-1",
      updateDto,
    );

    expect(result.transaction).toMatchObject({
      id: "tx-1",
      amount: 10,
      walletId: "wallet-2",
      concept: "Editado",
      revision: 3,
      createdAt: "2026-11-01T10:00:00.000Z",
    });
    const balances = new Map(
      result.wallets.map((wallet) => [wallet.id, wallet.balance]),
    );
    expect(balances.get("wallet-1")).toBe(125.5);
    expect(balances.get("wallet-2")).toBe(40);

    const [row] = await readTransactionRows(db, "tx-1");
    expect(row).toMatchObject({
      createdAt: "2026-11-01T10:00:00.000Z",
      revision: 3,
      syncStatus: "pending",
      walletId: "wallet-2",
    });

    const mutation = await findOutboxMutation(db, "tx-1");
    expect(mutation).toMatchObject({
      operation: "update",
      baseRevision: 3,
      localSnapshot: { amount: 10, walletId: "wallet-2" },
      serverSnapshot: { amount: 25.5, walletId: "wallet-1" },
    });
  });

  it("rejects editing a soft-deleted movement", async () => {
    await seedTransaction(db, {
      id: "deleted",
      deletedAt: "2026-11-10T10:00:00.000Z",
    });
    const repository = createRepository(db, createRemote());

    await expect(
      repository.updateTransaction(OFFLINE_OWNER, "deleted", updateDto),
    ).rejects.toMatchObject({ code: "TRANSACTION_NOT_FOUND" });
    await expect(listOutbox(db)).resolves.toHaveLength(0);
  });

  it("keeps one outbox row and the create snapshot when edited twice offline", async () => {
    const repository = createRepository(db, createRemote());
    const created = await repository.createTransaction(OFFLINE_OWNER, {
      ...updateDto,
      walletId: "wallet-1",
      amount: 25.5,
    });

    await repository.updateTransaction(OFFLINE_OWNER, created.transaction.id, {
      ...updateDto,
      walletId: "wallet-1",
      amount: 10,
    });
    await repository.updateTransaction(OFFLINE_OWNER, created.transaction.id, {
      ...updateDto,
      walletId: "wallet-1",
      amount: 5,
    });

    const [row] = await readTransactionRows(db, created.transaction.id);
    expect(row?.revision).toBe(0);
    expect(row?.syncStatus).toBe("pending");

    const mutations = await listOutbox(db);
    expect(mutations).toHaveLength(1);
    expect(mutations[0]).toMatchObject({
      operation: "create",
      baseRevision: 0,
      serverSnapshot: {},
      localSnapshot: { amount: 5, walletId: "wallet-1" },
    });
  });

  it("preserves stored link ids on an edit", async () => {
    await seedTransaction(db, {
      id: "linked",
      sharedExpenseId: "shared-1",
      groupExpenseId: "group-1",
    });
    const repository = createRepository(db, createRemote());

    await repository.updateTransaction(OFFLINE_OWNER, "linked", {
      ...updateDto,
      walletId: "wallet-1",
    });

    const [row] = await readTransactionRows(db, "linked");
    expect(row?.sharedExpenseId).toBe("shared-1");
    expect(row?.groupExpenseId).toBe("group-1");
  });

  it("requires the previous wallet to exist when moving wallets", async () => {
    await seedTransaction(db, { id: "orphan-missing", walletId: "gone" });
    const repository = createRepository(db, createRemote());

    await expect(
      repository.updateTransaction(OFFLINE_OWNER, "orphan-missing", updateDto),
    ).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });
  });

  it("rejects a previous wallet owned by another user", async () => {
    await seedWallet(db, { id: "foreign", ownerId: "owner-2" });
    await seedTransaction(db, { id: "foreign-previous", walletId: "foreign" });
    const repository = createRepository(db, createRemote());

    await expect(
      repository.updateTransaction(OFFLINE_OWNER, "foreign-previous", updateDto),
    ).rejects.toMatchObject({ code: "WALLET_NOT_OWNED" });
  });

  it("edits an orphan-wallet movement without touching a wallet", async () => {
    await seedTransaction(db, { id: "orphan", walletId: "-1" });
    const repository = createRepository(db, createRemote());

    const result = await repository.updateTransaction(
      OFFLINE_OWNER,
      "orphan",
      { ...updateDto, walletId: "-1", amount: 12, concept: "Huérfano" },
    );

    expect(result.transaction).toMatchObject({
      walletId: "-1",
      amount: 12,
      concept: "Huérfano",
    });
    expect(result.wallets).toEqual([]);

    const [wallet] = await db.select("wallets", {
      where: { id: "wallet-1" },
    });
    expect(wallet?.serverBalance).toBe(100);
    await expect(
      readTransactionRows(db, "orphan"),
    ).resolves.toMatchObject([{ walletId: "-1" }]);
  });

  it("validates the target wallet when moving out of the orphan id", async () => {
    await seedTransaction(db, { id: "orphan", walletId: "-1" });
    const repository = createRepository(db, createRemote());

    await expect(
      repository.updateTransaction(OFFLINE_OWNER, "orphan", {
        ...updateDto,
        walletId: "missing",
      }),
    ).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });

    const moved = await repository.updateTransaction(OFFLINE_OWNER, "orphan", {
      ...updateDto,
      walletId: "wallet-1",
      amount: 10,
    });
    expect(moved.transaction.walletId).toBe("wallet-1");
  });

  it("collapses an update followed by another update into one outbox row", async () => {
    const repository = createRepository(db, createRemote());

    await repository.updateTransaction(OFFLINE_OWNER, "tx-1", {
      ...updateDto,
      walletId: "wallet-1",
      amount: 10,
    });
    await repository.updateTransaction(OFFLINE_OWNER, "tx-1", {
      ...updateDto,
      walletId: "wallet-1",
      amount: 5,
    });

    const mutations = await listOutbox(db);
    expect(mutations).toHaveLength(1);
    expect(mutations[0]).toMatchObject({
      operation: "update",
      baseRevision: 3,
      serverSnapshot: { amount: 25.5, walletId: "wallet-1" },
      localSnapshot: { amount: 5, walletId: "wallet-1" },
    });
  });

  it("collapses an update followed by a delete and keeps the server state", async () => {
    const repository = createRepository(db, createRemote());

    await repository.updateTransaction(OFFLINE_OWNER, "tx-1", {
      ...updateDto,
      walletId: "wallet-1",
      amount: 10,
    });
    await repository.deleteTransaction(OFFLINE_OWNER, "tx-1");

    const mutations = await listOutbox(db);
    expect(mutations).toHaveLength(1);
    expect(mutations[0]).toMatchObject({
      operation: "delete",
      baseRevision: 3,
      serverSnapshot: { amount: 25.5, walletId: "wallet-1" },
    });
  });
});
