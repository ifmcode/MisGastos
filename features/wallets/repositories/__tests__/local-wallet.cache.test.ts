import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { migrateLocalDatabase } from "@/shared/lib/local-db/database";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import {
  resetLocalDatabasePort,
  setLocalDatabasePort,
} from "@/shared/lib/local-db/local-db.runtime";
import { NOW } from "@/shared/lib/local-db/__tests__/outbox.fixtures";

import { cacheWallets, readCachedWallets } from "../local-wallet.cache";
import { toWalletLocalRow } from "../local-wallet.mapper";
import { buildWallet, LOCAL_TEST_OWNER } from "./local-wallet.fixtures";

const FLAG = "EXPO_PUBLIC_OFFLINE_FIRST";
let previousFlag: string | undefined;

describe("wallets local cache", () => {
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
    await expect(readCachedWallets(LOCAL_TEST_OWNER)).resolves.toBeNull();
  });

  it("returns an empty list for a fetched but empty collection", async () => {
    await cacheWallets(LOCAL_TEST_OWNER, [], NOW);

    await expect(readCachedWallets(LOCAL_TEST_OWNER)).resolves.toEqual([]);
  });

  it("returns the cached wallets newest first after a write", async () => {
    const older = buildWallet({ id: "wallet-1" });
    const newer = buildWallet({
      id: "wallet-2",
      createdAt: "2026-10-29T10:00:00.000Z",
    });

    await cacheWallets(LOCAL_TEST_OWNER, [older, newer], NOW);

    const cached = await readCachedWallets(LOCAL_TEST_OWNER);
    expect(cached?.map((wallet) => wallet.id)).toEqual([
      "wallet-2",
      "wallet-1",
    ]);
  });

  it("skips a stored row the wallet mapper rejects", async () => {
    await cacheWallets(LOCAL_TEST_OWNER, [buildWallet()], NOW);
    await db.upsert("wallets", {
      id: "invalid",
      ownerId: LOCAL_TEST_OWNER,
      name: "   ",
      currency: "EUR",
      type: "cash",
    });

    const cached = await readCachedWallets(LOCAL_TEST_OWNER);
    expect(cached?.map((wallet) => wallet.id)).toEqual(["wallet-1"]);
  });

  it("removes rows missing from the next remote list", async () => {
    const first = buildWallet({ id: "wallet-1" });
    const second = buildWallet({ id: "wallet-2", name: "Ahorros" });

    await cacheWallets(LOCAL_TEST_OWNER, [first, second], NOW);
    await cacheWallets(LOCAL_TEST_OWNER, [second], NOW);

    const cached = await readCachedWallets(LOCAL_TEST_OWNER);
    expect(cached?.map((wallet) => wallet.id)).toEqual(["wallet-2"]);
  });

  it("keeps a pending local write when the remote list is mirrored", async () => {
    await db.upsert("wallets", {
      ...toWalletLocalRow(buildWallet({ id: "wallet-pending", name: "Local" })),
      syncStatus: "pending",
    });

    await cacheWallets(
      LOCAL_TEST_OWNER,
      [buildWallet({ id: "wallet-remote" })],
      NOW,
    );

    const [stored] = await db.select("wallets", {
      where: { id: "wallet-pending" },
    });
    expect(stored?.name).toBe("Local");
    expect(stored?.syncStatus).toBe("pending");
  });

  it("returns null when the local read throws", async () => {
    jest.spyOn(db, "select").mockRejectedValueOnce(new Error("read failed"));

    await expect(readCachedWallets(LOCAL_TEST_OWNER)).resolves.toBeNull();
  });

  it("does not read or write when the flag is off", async () => {
    process.env[FLAG] = "false";

    await expect(readCachedWallets(LOCAL_TEST_OWNER)).resolves.toBeNull();
    await cacheWallets(LOCAL_TEST_OWNER, [buildWallet()], NOW);

    await expect(db.count("wallets")).resolves.toBe(0);
    await expect(db.count("cacheMeta")).resolves.toBe(0);
  });

  it("returns null and writes nothing without a database port", async () => {
    setLocalDatabasePort(null);

    await expect(readCachedWallets(LOCAL_TEST_OWNER)).resolves.toBeNull();
    await cacheWallets(LOCAL_TEST_OWNER, [buildWallet()], NOW);

    await expect(db.count("wallets")).resolves.toBe(0);
  });
});
