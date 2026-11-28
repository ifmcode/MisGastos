import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { migrateLocalDatabase } from "@/shared/lib/local-db/database";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import {
  resetLocalDatabasePort,
  setLocalDatabasePort,
} from "@/shared/lib/local-db/local-db.runtime";
import { NOW } from "@/shared/lib/local-db/__tests__/outbox.fixtures";

import {
  cacheWallets,
  readCachedWallets,
  updateCachedWalletOrders,
} from "../local-wallet.cache";
import { toWalletLocalRow } from "../local-wallet.mapper";
import { buildWallet, LOCAL_TEST_OWNER } from "./local-wallet.fixtures";

const FLAG = "EXPO_PUBLIC_OFFLINE_FIRST";
const OTHER_OWNER = "owner-2";
let previousFlag: string | undefined;

describe("wallets local cache order updates", () => {
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

  it("replaces the legacy order with the persisted explicit order", async () => {
    const older = buildWallet({ id: "wallet-1" });
    const newer = buildWallet({
      id: "wallet-2",
      createdAt: "2026-10-29T10:00:00.000Z",
    });
    await cacheWallets(LOCAL_TEST_OWNER, [older, newer], NOW);

    await updateCachedWalletOrders(LOCAL_TEST_OWNER, [
      { id: "wallet-1", sortOrder: 0 },
      { id: "wallet-2", sortOrder: 1 },
    ]);

    const cached = await readCachedWallets(LOCAL_TEST_OWNER);
    expect(cached?.map((wallet) => wallet.id)).toEqual([
      "wallet-1",
      "wallet-2",
    ]);
  });

  it("keeps the wallets missing from the batch in their legacy order", async () => {
    const newest = buildWallet({
      id: "wallet-a",
      createdAt: "2026-10-29T12:00:00.000Z",
    });
    const middle = buildWallet({
      id: "wallet-b",
      createdAt: "2026-10-29T11:00:00.000Z",
    });
    const oldest = buildWallet({
      id: "wallet-c",
      createdAt: "2026-10-29T10:00:00.000Z",
    });
    await cacheWallets(LOCAL_TEST_OWNER, [newest, middle, oldest], NOW);

    await updateCachedWalletOrders(LOCAL_TEST_OWNER, [
      { id: "wallet-c", sortOrder: 0 },
      { id: "wallet-a", sortOrder: 1 },
    ]);

    const cached = await readCachedWallets(LOCAL_TEST_OWNER);
    expect(cached?.map((wallet) => wallet.id)).toEqual([
      "wallet-c",
      "wallet-a",
      "wallet-b",
    ]);
    expect(cached?.[2]).not.toHaveProperty("sortOrder");
  });

  it("never touches another owner's cached wallets", async () => {
    const own = buildWallet({ id: "wallet-1" });
    const foreign = buildWallet({
      id: "wallet-foreign",
      ownerId: OTHER_OWNER,
    });
    await cacheWallets(LOCAL_TEST_OWNER, [own], NOW);
    await cacheWallets(OTHER_OWNER, [foreign], NOW);

    await updateCachedWalletOrders(LOCAL_TEST_OWNER, [
      { id: "wallet-foreign", sortOrder: 0 },
    ]);

    const cached = await readCachedWallets(OTHER_OWNER);
    expect(cached?.map((wallet) => wallet.id)).toEqual(["wallet-foreign"]);
    expect(cached?.[0]).not.toHaveProperty("sortOrder");
  });

  it("writes only sortOrder and leaves the audit fields untouched", async () => {
    await db.upsert("wallets", toWalletLocalRow(buildWallet()));

    await updateCachedWalletOrders(LOCAL_TEST_OWNER, [
      { id: "wallet-1", sortOrder: 0 },
    ]);

    const [stored] = await db.select("wallets", { where: { id: "wallet-1" } });
    expect(stored?.sortOrder).toBe(0);
    expect(stored?.updatedAt).toBe("2026-10-28T11:00:00.000Z");
    expect(stored?.revision).toBe(2);
    expect(stored?.serverBalance).toBe(150.5);
    await expect(db.count("cacheMeta")).resolves.toBe(0);
  });

  it("does nothing when the flag is off or there is no port", async () => {
    await db.upsert("wallets", toWalletLocalRow(buildWallet({ sortOrder: 1 })));

    process.env[FLAG] = "false";
    await updateCachedWalletOrders(LOCAL_TEST_OWNER, [
      { id: "wallet-1", sortOrder: 0 },
    ]);

    process.env[FLAG] = "true";
    setLocalDatabasePort(null);
    await updateCachedWalletOrders(LOCAL_TEST_OWNER, [
      { id: "wallet-1", sortOrder: 0 },
    ]);

    const [stored] = await db.select("wallets", { where: { id: "wallet-1" } });
    expect(stored?.sortOrder).toBe(1);
  });
});
