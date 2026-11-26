import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { migrateLocalDatabase } from "@/shared/lib/local-db/database";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import {
  resetLocalDatabasePort,
  setLocalDatabasePort,
} from "@/shared/lib/local-db/local-db.runtime";
import { LocalOutboxRepository } from "@/shared/lib/local-db/local-outbox.repository";
import { NOW } from "@/shared/lib/local-db/__tests__/outbox.fixtures";

import { toWalletLocalRow } from "../local-wallet.mapper";
import {
  applyPendingWalletDeltas,
  readLocalWalletsWithPendingBalance,
  readPendingWalletDeltas,
  readWalletsWithPendingBalance,
} from "../local-wallet.balances";
import { buildWallet, LOCAL_TEST_OWNER } from "./local-wallet.fixtures";

describe("local wallet pending balances", () => {
  let db: InMemoryDatabase;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
    await db.upsert(
      "wallets",
      toWalletLocalRow(buildWallet({ id: "wallet-1", balance: 100 })),
    );
    await db.upsert(
      "wallets",
      toWalletLocalRow(
        buildWallet({ id: "wallet-2", balance: 50, name: "Ahorros" }),
      ),
    );
    await new LocalOutboxRepository(db).enqueue({
      clientMutationId: "m-1",
      ownerId: LOCAL_TEST_OWNER,
      entityType: "transaction",
      entityId: "tx-1",
      operation: "create",
      baseRevision: 0,
      localSnapshot: { type: "expense", amount: 25.5, walletId: "wallet-1" },
      now: NOW,
    });
  });

  afterEach(() => {
    resetLocalDatabasePort();
  });

  it("derives the pending delta from the outbox", async () => {
    const deltas = await readPendingWalletDeltas(db, LOCAL_TEST_OWNER);

    expect(deltas.get("wallet-1")).toBe(-25.5);
  });

  it("reads every wallet with the delta applied", async () => {
    const wallets = await readWalletsWithPendingBalance(db, LOCAL_TEST_OWNER);
    const balances = new Map(wallets.map((wallet) => [wallet.id, wallet.balance]));

    expect(balances.get("wallet-1")).toBe(74.5);
    expect(balances.get("wallet-2")).toBe(50);
  });

  it("narrows the result to the requested wallets", async () => {
    const wallets = await readWalletsWithPendingBalance(
      db,
      LOCAL_TEST_OWNER,
      ["wallet-2"],
    );

    expect(wallets.map((wallet) => wallet.id)).toEqual(["wallet-2"]);
  });

  it("skips a stored row the wallet mapper rejects", async () => {
    await db.upsert("wallets", {
      id: "invalid",
      ownerId: LOCAL_TEST_OWNER,
      name: "   ",
      currency: "EUR",
      type: "cash",
    });

    const wallets = await readWalletsWithPendingBalance(db, LOCAL_TEST_OWNER);

    expect(wallets.map((wallet) => wallet.id)).not.toContain("invalid");
  });

  it("returns the same wallet when it has no pending delta", () => {
    const wallet = buildWallet({ id: "wallet-9", balance: 10 });

    const [result] = applyPendingWalletDeltas([wallet], new Map());

    expect(result).toBe(wallet);
  });

  it("returns null without a local port", async () => {
    setLocalDatabasePort(null);

    await expect(
      readLocalWalletsWithPendingBalance(LOCAL_TEST_OWNER),
    ).resolves.toBeNull();
  });

  it("reads the runtime wallets with their derived balance", async () => {
    setLocalDatabasePort(db);

    const wallets = await readLocalWalletsWithPendingBalance(LOCAL_TEST_OWNER);
    const balances = new Map(
      wallets?.map((wallet) => [wallet.id, wallet.balance]),
    );

    expect(balances.get("wallet-1")).toBe(74.5);
  });

  it("returns null when the runtime read throws", async () => {
    setLocalDatabasePort(db);
    jest.spyOn(db, "select").mockRejectedValueOnce(new Error("read failed"));

    await expect(
      readLocalWalletsWithPendingBalance(LOCAL_TEST_OWNER),
    ).resolves.toBeNull();
  });
});
