import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { migrateLocalDatabase } from "@/shared/lib/local-db/database";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import {
  resetLocalDatabasePort,
  setLocalDatabasePort,
} from "@/shared/lib/local-db/local-db.runtime";
import { NOW } from "@/shared/lib/local-db/__tests__/outbox.fixtures";

import {
  cacheTransfer,
  readCachedTransfers,
} from "../local-transfer.cache";
import { toTransferLocalRow } from "../local-transfer.mapper";
import { buildTransfer, LOCAL_TEST_OWNER } from "./local-transfer.fixtures";

const FLAG = "EXPO_PUBLIC_OFFLINE_FIRST";
let previousFlag: string | undefined;

describe("transfers single-record cache", () => {
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
    await cacheTransfer(LOCAL_TEST_OWNER, buildTransfer(), NOW);

    // A local row is visible even before the first list read, but the
    // collection is still marked as never fetched.
    const cached = await readCachedTransfers(LOCAL_TEST_OWNER);
    expect(cached?.map((transfer) => transfer.id)).toEqual(["transfer-1"]);
    await expect(db.count("cacheMeta")).resolves.toBe(0);
  });

  it("does not overwrite a pending row", async () => {
    await db.upsert("transfers", {
      ...toTransferLocalRow(buildTransfer({ notes: "Local" })),
      syncStatus: "pending",
    });

    await cacheTransfer(
      LOCAL_TEST_OWNER,
      buildTransfer({ notes: "Remote" }),
      NOW,
    );

    const [stored] = await db.select("transfers", {
      where: { id: "transfer-1" },
    });
    expect(stored?.notes).toBe("Local");
    expect(stored?.syncStatus).toBe("pending");
  });

  it("does not write when the flag is off", async () => {
    process.env[FLAG] = "false";

    await cacheTransfer(LOCAL_TEST_OWNER, buildTransfer(), NOW);

    await expect(db.count("transfers")).resolves.toBe(0);
  });

  it("returns without a database port", async () => {
    setLocalDatabasePort(null);

    await cacheTransfer(LOCAL_TEST_OWNER, buildTransfer(), NOW);

    await expect(db.count("transfers")).resolves.toBe(0);
  });
});
