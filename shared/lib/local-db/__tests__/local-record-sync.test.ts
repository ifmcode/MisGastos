import { beforeEach, describe, expect, it } from "@jest/globals";

import { InMemoryDatabase } from "../in-memory.database";
import {
  applyRemoteRecord,
  deleteLocalRecord,
  markRecordSynced,
  setRecordSyncStatus,
} from "../local-record-sync";
import { applyRemoteWalletBalances } from "../local-wallet-sync";

const NOW = "2026-11-26T10:00:00.000Z";

function seedTransaction(db: InMemoryDatabase, overrides = {}) {
  return db.upsert("transactions", {
    id: "tx-1",
    ownerId: "owner-1",
    type: "expense",
    amount: 25,
    currency: "EUR",
    walletId: "wallet-1",
    categoryId: "cat-1",
    concept: "Supermercado",
    date: "2026-11-26",
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    revision: 2,
    syncStatus: "pending",
    ...overrides,
  });
}

function seedWallet(db: InMemoryDatabase) {
  return db.upsert("wallets", {
    id: "wallet-1",
    ownerId: "owner-1",
    name: "Cuenta",
    currency: "EUR",
    type: "bank",
    icon: "wallet",
    color: "#000",
    initialBalance: 100,
    serverBalance: 100,
    includeInTotal: 1,
    description: null,
    archivedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    revision: 1,
    syncStatus: "synced",
  });
}

describe("local record sync", () => {
  let db: InMemoryDatabase;

  beforeEach(() => {
    db = new InMemoryDatabase();
  });

  it("marks a transaction synced with the server revision", async () => {
    await seedTransaction(db);

    await db.transaction((tx) =>
      markRecordSynced(tx, "transaction", "owner-1", "tx-1", 3, NOW),
    );

    const [row] = await db.select("transactions", { where: { id: "tx-1" } });
    expect(row).toMatchObject({ revision: 3, syncStatus: "synced" });
  });

  it("marks a transfer synced", async () => {
    await db.upsert("transfers", {
      id: "transfer-1",
      ownerId: "owner-1",
      fromWalletId: "wallet-1",
      toWalletId: "wallet-2",
      amount: 10,
      currency: "EUR",
      date: "2026-11-26",
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
      revision: 1,
      syncStatus: "syncing",
    });

    await db.transaction((tx) =>
      markRecordSynced(tx, "transfer", "owner-1", "transfer-1", 2, NOW),
    );

    const [row] = await db.select("transfers", { where: { id: "transfer-1" } });
    expect(row).toMatchObject({ revision: 2, syncStatus: "synced" });
  });

  it("sets the queued, failed and conflict status", async () => {
    await seedTransaction(db);

    await db.transaction((tx) =>
      setRecordSyncStatus(tx, "transaction", "owner-1", "tx-1", "failed", NOW),
    );

    const [row] = await db.select("transactions", { where: { id: "tx-1" } });
    expect(row.syncStatus).toBe("failed");
  });

  it("applies a remote snapshot with only known columns", async () => {
    await seedTransaction(db);

    await db.transaction((tx) =>
      applyRemoteRecord(
        tx,
        "transaction",
        "owner-1",
        "tx-1",
        {
          amount: 40,
          concept: "Cena",
          revision: 5,
          unknownField: "ignored",
          syncStatus: "pending",
        },
        NOW,
      ),
    );

    const [row] = await db.select("transactions", { where: { id: "tx-1" } });
    expect(row).toMatchObject({
      amount: 40,
      concept: "Cena",
      revision: 5,
      syncStatus: "synced",
    });
    expect(row.unknownField).toBeUndefined();
    expect(row.walletId).toBe("wallet-1");
  });

  it("keeps the stored updatedAt when the remote snapshot has none", async () => {
    await seedTransaction(db);

    await db.transaction((tx) =>
      applyRemoteRecord(tx, "transaction", "owner-1", "tx-1", {}, NOW),
    );

    const [row] = await db.select("transactions", { where: { id: "tx-1" } });
    expect(row.updatedAt).toBe(NOW);
  });

  it("deletes the local row when the remote document is gone", async () => {
    await seedTransaction(db);

    await db.transaction((tx) =>
      deleteLocalRecord(tx, "transaction", "owner-1", "tx-1"),
    );

    await expect(db.count("transactions")).resolves.toBe(0);
  });

  it("stores the server wallet balance rounded", async () => {
    await seedWallet(db);

    await db.transaction((tx) =>
      applyRemoteWalletBalances(
        tx,
        "owner-1",
        [{ id: "wallet-1", balance: 74.49999, revision: 2 }],
        NOW,
      ),
    );

    const [row] = await db.select("wallets", { where: { id: "wallet-1" } });
    expect(row).toMatchObject({ serverBalance: 74.5, revision: 2 });
  });

  it("ignores wallets from another account", async () => {
    await seedWallet(db);

    await db.transaction((tx) =>
      applyRemoteWalletBalances(
        tx,
        "owner-2",
        [{ id: "wallet-1", balance: 10, revision: 2 }],
        NOW,
      ),
    );

    const [row] = await db.select("wallets", { where: { id: "wallet-1" } });
    expect(row.serverBalance).toBe(100);
  });

  it("rejects an entity the sync engine cannot write", async () => {
    await expect(
      db.transaction((tx) =>
        markRecordSynced(tx, "wallet", "owner-1", "wallet-1", 1, NOW),
      ),
    ).rejects.toThrow("SYNC_UNSUPPORTED_ENTITY");
  });
});
