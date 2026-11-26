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

const updateDto = {
  fromWalletId: "wallet-1",
  toWalletId: "wallet-2",
  amount: 40,
  currency: "EUR" as const,
  date: "2026-11-20",
};

describe("OfflineTransferRepository update", () => {
  let db: InMemoryDatabase;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
    await seedWallet(db, { id: "wallet-1", balance: 100 });
    await seedWallet(db, { id: "wallet-2", balance: 50, name: "Ahorros" });
    await seedTransfer(db);
  });

  it("keeps createdAt and the server revision while queueing an update", async () => {
    const repository = createRepository(db, createRemote());

    const result = await repository.updateTransfer(
      OFFLINE_OWNER,
      "transfer-1",
      updateDto,
    );

    expect(result.transfer).toMatchObject({
      id: "transfer-1",
      amount: 40,
      revision: 2,
      createdAt: "2026-11-01T10:00:00.000Z",
    });
    const balances = new Map(
      result.wallets.map((wallet) => [wallet.id, wallet.balance]),
    );
    expect(balances.get("wallet-1")).toBe(85.5);
    expect(balances.get("wallet-2")).toBe(64.5);

    const [row] = await readTransferRows(db, "transfer-1");
    expect(row).toMatchObject({
      revision: 2,
      syncStatus: "pending",
      createdAt: "2026-11-01T10:00:00.000Z",
    });

    const mutation = await findOutboxMutation(db, "transfer-1");
    expect(mutation).toMatchObject({
      operation: "update",
      baseRevision: 2,
      localSnapshot: { amount: 40 },
      serverSnapshot: { amount: 25.5 },
    });
  });

  it("keeps a single create outbox row after editing an offline create", async () => {
    const repository = createRepository(db, createRemote());
    const created = await repository.createTransfer(OFFLINE_OWNER, {
      fromWalletId: "wallet-1",
      toWalletId: "wallet-2",
      amount: 40,
      currency: "EUR",
      date: "2026-11-20",
    });

    await repository.updateTransfer(OFFLINE_OWNER, created.transfer.id, {
      ...updateDto,
      amount: 30,
    });

    const mutations = await listOutbox(db);
    expect(mutations).toHaveLength(1);
    expect(mutations[0]).toMatchObject({
      operation: "create",
      baseRevision: 0,
      serverSnapshot: {},
      localSnapshot: { amount: 30 },
    });
    const [row] = await readTransferRows(db, created.transfer.id);
    expect(row?.revision).toBe(0);
  });

  it("keeps one outbox row and the original server state after two edits", async () => {
    const repository = createRepository(db, createRemote());

    await repository.updateTransfer(OFFLINE_OWNER, "transfer-1", updateDto);
    await repository.updateTransfer(OFFLINE_OWNER, "transfer-1", {
      ...updateDto,
      amount: 30,
    });

    const mutations = await listOutbox(db);
    expect(mutations).toHaveLength(1);
    expect(mutations[0]).toMatchObject({
      operation: "update",
      baseRevision: 2,
      serverSnapshot: { amount: 25.5 },
      localSnapshot: { amount: 30 },
    });
  });

  it("rejects editing a soft-deleted transfer", async () => {
    await seedTransfer(db, {
      id: "deleted",
      deletedAt: "2026-11-10T10:00:00.000Z",
    });
    const repository = createRepository(db, createRemote());

    await expect(
      repository.updateTransfer(OFFLINE_OWNER, "deleted", updateDto),
    ).rejects.toMatchObject({ code: "TRANSFER_NOT_FOUND" });
  });

  it("adds the previous amount back when validating the same source wallet", async () => {
    await seedWallet(db, { id: "wallet-1", balance: 20 });
    const repository = createRepository(db, createRemote());

    // The stored server balance already had 25.5 taken out; adding it back
    // leaves 45.5 available, enough for the 40 transfer only after the revert.
    await expect(
      repository.updateTransfer(OFFLINE_OWNER, "transfer-1", updateDto),
    ).resolves.toMatchObject({ transfer: { amount: 40 } });
  });

  it("subtracts the previous amount when moving the source to the old destination", async () => {
    const repository = createRepository(db, createRemote());

    // wallet-2 received 25.5, so its available balance before the edit is 24.5.
    await expect(
      repository.updateTransfer(OFFLINE_OWNER, "transfer-1", {
        ...updateDto,
        fromWalletId: "wallet-2",
        toWalletId: "wallet-1",
        amount: 30,
      }),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_FUNDS" });
  });

  it("rejects a missing previous source wallet", async () => {
    await seedTransfer(db, { id: "previous-missing", fromWalletId: "gone" });
    const repository = createRepository(db, createRemote());

    await expect(
      repository.updateTransfer(OFFLINE_OWNER, "previous-missing", updateDto),
    ).rejects.toMatchObject({ code: "FROM_WALLET_NOT_FOUND" });
  });

  it("rejects a missing previous destination wallet", async () => {
    await seedTransfer(db, { id: "previous-missing", toWalletId: "gone" });
    const repository = createRepository(db, createRemote());

    await expect(
      repository.updateTransfer(OFFLINE_OWNER, "previous-missing", updateDto),
    ).rejects.toMatchObject({ code: "TO_WALLET_NOT_FOUND" });
  });

  it("rejects a previous wallet owned by another user", async () => {
    await seedWallet(db, { id: "foreign", ownerId: "owner-2" });
    await seedTransfer(db, { id: "foreign-previous", fromWalletId: "foreign" });
    const repository = createRepository(db, createRemote());

    await expect(
      repository.updateTransfer(OFFLINE_OWNER, "foreign-previous", updateDto),
    ).rejects.toMatchObject({ code: "WALLET_NOT_OWNED" });
  });

  it("rejects a currency mismatch on the next wallets", async () => {
    const repository = createRepository(db, createRemote());

    await expect(
      repository.updateTransfer(OFFLINE_OWNER, "transfer-1", {
        ...updateDto,
        currency: "USD",
      }),
    ).rejects.toMatchObject({ code: "CURRENCY_MISMATCH" });
  });
});
