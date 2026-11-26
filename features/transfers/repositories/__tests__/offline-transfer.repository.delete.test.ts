import { beforeEach, describe, expect, it } from "@jest/globals";

import { migrateLocalDatabase } from "@/shared/lib/local-db/database";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import type { Transfer } from "../../types/transfer.types";
import { toTransferLocalRow } from "../local-transfer.mapper";
import { buildTransfer } from "./local-transfer.fixtures";
import {
  createRemote,
  createRepository,
  findOutboxMutation,
  listOutbox,
  OFFLINE_OWNER,
  readTransferRows,
  seedWallet,
} from "./offline-transfer.fixtures";

async function seedTransfer(
  db: InMemoryDatabase,
  overrides: Partial<Transfer> = {},
): Promise<void> {
  await db.upsert(
    "transfers",
    toTransferLocalRow(
      buildTransfer({
        id: "transfer-1",
        fromWalletName: undefined,
        toWalletName: undefined,
        amount: 25.5,
        ownerId: OFFLINE_OWNER,
        revision: 2,
        createdAt: "2026-11-01T10:00:00.000Z",
        updatedAt: "2026-11-01T10:00:00.000Z",
        ...overrides,
      }),
    ),
  );
}

describe("OfflineTransferRepository delete", () => {
  let db: InMemoryDatabase;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
    await seedWallet(db, { id: "wallet-1", balance: 100 });
    await seedWallet(db, { id: "wallet-2", balance: 50, name: "Ahorros" });
    await seedTransfer(db);
  });

  it("soft-deletes the row and queues the delete", async () => {
    const repository = createRepository(db, createRemote());

    const result = await repository.deleteTransfer(OFFLINE_OWNER, "transfer-1");

    expect(result.transfer.deletedAt).toBe("2026-11-20T10:00:00.000Z");
    const balances = new Map(
      result.wallets.map((wallet) => [wallet.id, wallet.balance]),
    );
    expect(balances.get("wallet-1")).toBe(125.5);
    expect(balances.get("wallet-2")).toBe(24.5);

    const [row] = await readTransferRows(db, "transfer-1");
    expect(row).toMatchObject({
      revision: 2,
      syncStatus: "pending",
      deletedAt: "2026-11-20T10:00:00.000Z",
    });

    await expect(findOutboxMutation(db, "transfer-1")).resolves.toMatchObject({
      operation: "delete",
      baseRevision: 2,
      serverSnapshot: { amount: 25.5 },
    });
  });

  it("rejects deleting a transfer twice", async () => {
    await seedTransfer(db, {
      id: "deleted",
      deletedAt: "2026-11-10T10:00:00.000Z",
    });
    const repository = createRepository(db, createRemote());

    await expect(
      repository.deleteTransfer(OFFLINE_OWNER, "deleted"),
    ).rejects.toMatchObject({ code: "TRANSFER_NOT_FOUND" });
  });

  it("coalesces an update into a delete and keeps the server state", async () => {
    const repository = createRepository(db, createRemote());
    await repository.updateTransfer(OFFLINE_OWNER, "transfer-1", {
      fromWalletId: "wallet-1",
      toWalletId: "wallet-2",
      amount: 40,
      currency: "EUR",
      date: "2026-11-20",
    });

    await repository.deleteTransfer(OFFLINE_OWNER, "transfer-1");

    const mutations = await listOutbox(db);
    expect(mutations).toHaveLength(1);
    expect(mutations[0]).toMatchObject({
      operation: "delete",
      baseRevision: 2,
      serverSnapshot: { amount: 25.5 },
    });
  });

  it("cancels a transfer created offline without sending anything", async () => {
    const repository = createRepository(db, createRemote());
    const created = await repository.createTransfer(OFFLINE_OWNER, {
      fromWalletId: "wallet-1",
      toWalletId: "wallet-2",
      amount: 40,
      currency: "EUR",
      date: "2026-11-20",
    });

    const deleted = await repository.deleteTransfer(
      OFFLINE_OWNER,
      created.transfer.id,
    );

    expect(deleted.transfer.deletedAt).toBe("2026-11-20T10:00:00.000Z");
    await expect(readTransferRows(db, created.transfer.id)).resolves.toEqual([]);
    await expect(listOutbox(db)).resolves.toHaveLength(0);
    await expect(readTransferRows(db, "transfer-1")).resolves.toHaveLength(1);
  });
});
