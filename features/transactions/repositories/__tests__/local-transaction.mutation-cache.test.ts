import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { migrateLocalDatabase } from "@/shared/lib/local-db/database";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import {
  resetLocalDatabasePort,
  setLocalDatabasePort,
} from "@/shared/lib/local-db/local-db.runtime";
import { NOW } from "@/shared/lib/local-db/__tests__/outbox.fixtures";

import {
  cacheTransaction,
  readCachedTransactions,
} from "../local-transaction.cache";
import { toTransactionLocalRow } from "../local-transaction.mapper";
import {
  buildTransaction,
  LOCAL_TEST_OWNER,
} from "./local-transaction.fixtures";

const FLAG = "EXPO_PUBLIC_OFFLINE_FIRST";
let previousFlag: string | undefined;

describe("transactions single-record cache", () => {
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

    if (previousFlag === undefined) {
      delete process.env[FLAG];
    } else {
      process.env[FLAG] = previousFlag;
    }
  });

  it("mirrors a mutation without marking the collection fetched", async () => {
    await cacheTransaction(LOCAL_TEST_OWNER, buildTransaction(), NOW);

    // A local row is visible even before the first list read, but the
    // collection is still marked as never fetched.
    const cached = await readCachedTransactions(LOCAL_TEST_OWNER);
    expect(cached?.map((transaction) => transaction.id)).toEqual([
      "transaction-1",
    ]);
    await expect(db.count("cacheMeta")).resolves.toBe(0);
  });

  it("does not overwrite a pending row", async () => {
    await db.upsert("transactions", {
      ...toTransactionLocalRow(buildTransaction({ concept: "Local" })),
      syncStatus: "pending",
    });

    await cacheTransaction(
      LOCAL_TEST_OWNER,
      buildTransaction({ concept: "Remote" }),
      NOW,
    );

    const [stored] = await db.select("transactions", {
      where: { id: "transaction-1" },
    });
    expect(stored?.concept).toBe("Local");
    expect(stored?.syncStatus).toBe("pending");
  });

  it("does not write when the flag is off", async () => {
    process.env[FLAG] = "false";

    await cacheTransaction(LOCAL_TEST_OWNER, buildTransaction(), NOW);

    await expect(db.count("transactions")).resolves.toBe(0);
  });

  it("returns without a database port", async () => {
    setLocalDatabasePort(null);

    await cacheTransaction(LOCAL_TEST_OWNER, buildTransaction(), NOW);

    await expect(db.count("transactions")).resolves.toBe(0);
  });
});
