import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { migrateLocalDatabase } from "@/shared/lib/local-db/database";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import {
  resetLocalDatabasePort,
  setLocalDatabasePort,
} from "@/shared/lib/local-db/local-db.runtime";
import { NOW } from "@/shared/lib/local-db/__tests__/outbox.fixtures";

import {
  cacheTransfers,
  readCachedTransfers,
} from "../local-transfer.cache";
import { toTransferLocalRow } from "../local-transfer.mapper";
import { buildTransfer, LOCAL_TEST_OWNER } from "./local-transfer.fixtures";

const FLAG = "EXPO_PUBLIC_OFFLINE_FIRST";
let previousFlag: string | undefined;

describe("transfers local cache", () => {
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
    await expect(readCachedTransfers(LOCAL_TEST_OWNER)).resolves.toBeNull();
  });

  it("returns an empty list for a fetched but empty collection", async () => {
    await cacheTransfers(LOCAL_TEST_OWNER, [], NOW);

    await expect(readCachedTransfers(LOCAL_TEST_OWNER)).resolves.toEqual([]);
  });

  it("does not return soft-deleted transfers", async () => {
    await cacheTransfers(LOCAL_TEST_OWNER, [buildTransfer()], NOW);
    await db.upsert(
      "transfers",
      toTransferLocalRow(
        buildTransfer({
          id: "transfer-deleted",
          deletedAt: "2026-11-01T10:00:00.000Z",
        }),
      ),
    );

    const cached = await readCachedTransfers(LOCAL_TEST_OWNER);
    expect(cached?.map((transfer) => transfer.id)).toEqual(["transfer-1"]);
  });

  it("returns the cached transfers newest first after a write", async () => {
    const older = buildTransfer({ id: "transfer-1" });
    const newer = buildTransfer({ id: "transfer-2", date: "2026-10-31" });

    await cacheTransfers(LOCAL_TEST_OWNER, [older, newer], NOW);

    const cached = await readCachedTransfers(LOCAL_TEST_OWNER);
    expect(cached?.map((transfer) => transfer.id)).toEqual([
      "transfer-2",
      "transfer-1",
    ]);
  });

  it("skips a stored row the transfer mapper rejects", async () => {
    await cacheTransfers(LOCAL_TEST_OWNER, [buildTransfer()], NOW);
    await db.upsert("transfers", {
      id: "invalid",
      ownerId: LOCAL_TEST_OWNER,
      fromWalletId: "wallet-1",
      toWalletId: "wallet-1",
      amount: 10,
      currency: "EUR",
      date: "2026-10-30",
    });

    const cached = await readCachedTransfers(LOCAL_TEST_OWNER);
    expect(cached?.map((transfer) => transfer.id)).toEqual(["transfer-1"]);
  });

  it("removes rows missing from the next remote list", async () => {
    const first = buildTransfer({ id: "transfer-1" });
    const second = buildTransfer({ id: "transfer-2" });

    await cacheTransfers(LOCAL_TEST_OWNER, [first, second], NOW);
    await cacheTransfers(LOCAL_TEST_OWNER, [second], NOW);

    const cached = await readCachedTransfers(LOCAL_TEST_OWNER);
    expect(cached?.map((transfer) => transfer.id)).toEqual(["transfer-2"]);
  });

  it("returns null when the local read throws", async () => {
    jest.spyOn(db, "select").mockRejectedValueOnce(new Error("read failed"));

    await expect(readCachedTransfers(LOCAL_TEST_OWNER)).resolves.toBeNull();
  });

  it("does not read or write when the flag is off", async () => {
    process.env[FLAG] = "false";

    await expect(readCachedTransfers(LOCAL_TEST_OWNER)).resolves.toBeNull();
    await cacheTransfers(LOCAL_TEST_OWNER, [buildTransfer()], NOW);

    await expect(db.count("transfers")).resolves.toBe(0);
    await expect(db.count("cacheMeta")).resolves.toBe(0);
  });

  it("returns null and writes nothing without a database port", async () => {
    setLocalDatabasePort(null);

    await expect(readCachedTransfers(LOCAL_TEST_OWNER)).resolves.toBeNull();
    await cacheTransfers(LOCAL_TEST_OWNER, [buildTransfer()], NOW);

    await expect(db.count("transfers")).resolves.toBe(0);
  });
});
