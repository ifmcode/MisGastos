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
        ownerId: OFFLINE_OWNER,
        revision: 3,
        createdAt: "2026-11-01T10:00:00.000Z",
        updatedAt: "2026-11-01T10:00:00.000Z",
        ...overrides,
      }),
    ),
  );
}

describe("OfflineTransactionRepository delete", () => {
  let db: InMemoryDatabase;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
    await seedWallet(db, { id: "wallet-1", balance: 100 });
    await seedTransaction(db);
  });

  it("soft-deletes the row and queues the delete", async () => {
    const repository = createRepository(db, createRemote());

    const result = await repository.deleteTransaction(OFFLINE_OWNER, "tx-1");

    expect(result.transaction.deletedAt).toBe("2026-11-20T10:00:00.000Z");
    expect(result.wallets.map((wallet) => wallet.balance)).toEqual([125.5]);

    const [row] = await readTransactionRows(db, "tx-1");
    expect(row).toMatchObject({
      revision: 3,
      syncStatus: "pending",
      deletedAt: "2026-11-20T10:00:00.000Z",
    });

    const mutation = await findOutboxMutation(db, "tx-1");
    expect(mutation).toMatchObject({
      operation: "delete",
      baseRevision: 3,
      serverSnapshot: { amount: 25.5, walletId: "wallet-1" },
    });
  });

  it("is idempotent and never queues a second delete", async () => {
    const repository = createRepository(db, createRemote());

    await repository.deleteTransaction(OFFLINE_OWNER, "tx-1");
    const second = await repository.deleteTransaction(OFFLINE_OWNER, "tx-1");

    expect(second.transaction.deletedAt).toBe("2026-11-20T10:00:00.000Z");
    await expect(listOutbox(db)).resolves.toHaveLength(1);
  });

  it("returns the stored stamps when the movement is already deleted", async () => {
    await seedTransaction(db, {
      id: "already-deleted",
      deletedAt: "2026-11-05T10:00:00.000Z",
      updatedAt: "2026-11-06T10:00:00.000Z",
    });
    const repository = createRepository(db, createRemote());

    const result = await repository.deleteTransaction(
      OFFLINE_OWNER,
      "already-deleted",
    );

    expect(result.transaction.deletedAt).toBe("2026-11-05T10:00:00.000Z");
    expect(result.transaction.updatedAt).toBe("2026-11-06T10:00:00.000Z");
  });

  it("rejects a movement linked to a shared or group record", async () => {
    await seedTransaction(db, { id: "linked", sharedExpenseId: "shared-1" });
    const repository = createRepository(db, createRemote());

    await expect(
      repository.deleteTransaction(OFFLINE_OWNER, "linked"),
    ).rejects.toMatchObject({ code: "TRANSACTION_INVALID" });
    await expect(findOutboxMutation(db, "linked")).resolves.toBeNull();
  });

  it("cancels a create pending sync without writing to the outbox", async () => {
    const repository = createRepository(db, createRemote());
    const created = await repository.createTransaction(OFFLINE_OWNER, {
      type: "expense",
      amount: 10,
      currency: "EUR",
      walletId: "wallet-1",
      categoryId: "category-1",
      concept: "Temporal",
      date: "2026-11-20",
    });

    const deleted = await repository.deleteTransaction(
      OFFLINE_OWNER,
      created.transaction.id,
    );

    expect(deleted.transaction.deletedAt).toBe("2026-11-20T10:00:00.000Z");
    await expect(readTransactionRows(db, created.transaction.id)).resolves.toEqual(
      [],
    );
    await expect(listOutbox(db)).resolves.toHaveLength(0);
    await expect(
      readTransactionRows(db, "tx-1"),
    ).resolves.toHaveLength(1);
  });
});
