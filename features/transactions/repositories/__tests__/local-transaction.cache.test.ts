import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { migrateLocalDatabase } from "@/shared/lib/local-db/database";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import {
  resetLocalDatabasePort,
  setLocalDatabasePort,
} from "@/shared/lib/local-db/local-db.runtime";
import { NOW } from "@/shared/lib/local-db/__tests__/outbox.fixtures";

import {
  cacheTransactions,
  readCachedTransactions,
} from "../local-transaction.cache";
import { toTransactionLocalRow } from "../local-transaction.mapper";
import {
  buildTransaction,
  LOCAL_TEST_OWNER,
} from "./local-transaction.fixtures";

const FLAG = "EXPO_PUBLIC_OFFLINE_FIRST";
let previousFlag: string | undefined;

describe("transactions local cache", () => {
  let db: InMemoryDatabase;

  beforeEach(async () => {
    previousFlag = process.env[FLAG];
    process.env[FLAG] = "true";
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
    setLocalDatabasePort(db);
  });

  afterEach(() => {
    resetLocalDatabasePort();
    jest.restoreAllMocks();

    if (previousFlag === undefined) {
      delete process.env[FLAG];
    } else {
      process.env[FLAG] = previousFlag;
    }
  });

  it("returns null for a cold cache", async () => {
    await expect(readCachedTransactions(LOCAL_TEST_OWNER)).resolves.toBeNull();
  });

  it("returns an empty list for a fetched but empty collection", async () => {
    await cacheTransactions(LOCAL_TEST_OWNER, [], NOW);

    await expect(readCachedTransactions(LOCAL_TEST_OWNER)).resolves.toEqual([]);
  });

  it("does not return soft-deleted movements", async () => {
    await cacheTransactions(LOCAL_TEST_OWNER, [buildTransaction()], NOW);
    await db.upsert(
      "transactions",
      toTransactionLocalRow(
        buildTransaction({
          id: "transaction-deleted",
          deletedAt: "2026-11-01T10:00:00.000Z",
        }),
      ),
    );

    const cached = await readCachedTransactions(LOCAL_TEST_OWNER);
    expect(cached?.map((transaction) => transaction.id)).toEqual([
      "transaction-1",
    ]);
  });

  it("returns the cached movements after a write", async () => {
    const transaction = buildTransaction();

    await cacheTransactions(LOCAL_TEST_OWNER, [transaction], NOW);

    await expect(readCachedTransactions(LOCAL_TEST_OWNER)).resolves.toEqual([
      transaction,
    ]);
  });

  it("skips a stored row the movement mapper rejects", async () => {
    await cacheTransactions(LOCAL_TEST_OWNER, [buildTransaction()], NOW);
    await db.upsert("transactions", {
      id: "invalid",
      ownerId: LOCAL_TEST_OWNER,
      type: "gift",
      amount: 10,
      currency: "EUR",
      walletId: "wallet-1",
      concept: "Cena",
      date: "2026-10-29",
    });

    const cached = await readCachedTransactions(LOCAL_TEST_OWNER);
    expect(cached?.map((transaction) => transaction.id)).toEqual([
      "transaction-1",
    ]);
  });

  it("returns a local row even when the collection was never listed", async () => {
    await db.upsert(
      "transactions",
      toTransactionLocalRow(buildTransaction({ id: "transaction-local" })),
    );

    const cached = await readCachedTransactions(LOCAL_TEST_OWNER);

    expect(cached?.map((transaction) => transaction.id)).toEqual([
      "transaction-local",
    ]);
  });

  it("removes rows missing from the next remote list", async () => {
    const first = buildTransaction({ id: "transaction-1" });
    const second = buildTransaction({
      id: "transaction-2",
      concept: "Café",
    });

    await cacheTransactions(LOCAL_TEST_OWNER, [first, second], NOW);
    await cacheTransactions(LOCAL_TEST_OWNER, [second], NOW);

    const cached = await readCachedTransactions(LOCAL_TEST_OWNER);
    expect(cached?.map((transaction) => transaction.id)).toEqual([
      "transaction-2",
    ]);
  });

  it("returns null when the local read throws", async () => {
    jest.spyOn(db, "select").mockRejectedValueOnce(new Error("read failed"));

    await expect(readCachedTransactions(LOCAL_TEST_OWNER)).resolves.toBeNull();
  });

  it("does not read or write when the flag is off", async () => {
    process.env[FLAG] = "false";

    await expect(readCachedTransactions(LOCAL_TEST_OWNER)).resolves.toBeNull();
    await cacheTransactions(LOCAL_TEST_OWNER, [buildTransaction()], NOW);

    await expect(db.count("transactions")).resolves.toBe(0);
    await expect(db.count("cacheMeta")).resolves.toBe(0);
  });

  it("returns null and writes nothing without a database port", async () => {
    setLocalDatabasePort(null);

    await expect(readCachedTransactions(LOCAL_TEST_OWNER)).resolves.toBeNull();
    await cacheTransactions(LOCAL_TEST_OWNER, [buildTransaction()], NOW);

    await expect(db.count("transactions")).resolves.toBe(0);
  });
});
