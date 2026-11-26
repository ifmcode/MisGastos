import { beforeEach, describe, expect, it } from "@jest/globals";

import { migrateLocalDatabase } from "@/shared/lib/local-db/database";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import { LocalOutboxRepository } from "@/shared/lib/local-db/local-outbox.repository";
import type { CreateTransferDto } from "../../types/transfer.types";
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

const dto: CreateTransferDto = {
  fromWalletId: "wallet-1",
  toWalletId: "wallet-2",
  amount: 40,
  currency: "EUR",
  date: "2026-11-20",
  notes: "  Ahorro  ",
};

describe("OfflineTransferRepository create", () => {
  let db: InMemoryDatabase;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
    await seedWallet(db, { id: "wallet-1", balance: 100 });
    await seedWallet(db, { id: "wallet-2", balance: 50, name: "Ahorros" });
  });

  it("writes a pending transfer and queues the outbox create", async () => {
    const repository = createRepository(db, createRemote());

    const result = await repository.createTransfer(OFFLINE_OWNER, dto);

    expect(result.transfer).toMatchObject({
      id: "id-1",
      amount: 40,
      currency: "EUR",
      notes: "Ahorro",
      revision: 0,
    });
    const balances = new Map(
      result.wallets.map((wallet) => [wallet.id, wallet.balance]),
    );
    expect(balances.get("wallet-1")).toBe(60);
    expect(balances.get("wallet-2")).toBe(90);

    const [row] = await readTransferRows(db, "id-1");
    expect(row).toMatchObject({ syncStatus: "pending", revision: 0 });

    const mutation = await findOutboxMutation(db, "id-1");
    expect(mutation).toMatchObject({
      operation: "create",
      baseRevision: 0,
      serverSnapshot: {},
      localSnapshot: {
        fromWalletId: "wallet-1",
        toWalletId: "wallet-2",
        amount: 40,
      },
    });
  });

  it("uses a provided free client id", async () => {
    const repository = createRepository(db, createRemote());

    const result = await repository.createTransfer(OFFLINE_OWNER, {
      ...dto,
      id: "client-transfer",
    });

    expect(result.transfer.id).toBe("client-transfer");
    await expect(
      findOutboxMutation(db, "client-transfer"),
    ).resolves.toMatchObject({ clientMutationId: "id-1" });
  });

  it("rejects an id that already exists for another owner", async () => {
    await db.upsert(
      "transfers",
      toTransferLocalRow(buildTransfer({ id: "dup", ownerId: "owner-2" })),
    );
    const repository = createRepository(db, createRemote());

    await expect(
      repository.createTransfer(OFFLINE_OWNER, { ...dto, id: "dup" }),
    ).rejects.toMatchObject({ code: "TRANSFER_INVALID" });

    await expect(listOutbox(db)).resolves.toHaveLength(0);
  });

  it("rejects a self transfer", async () => {
    const repository = createRepository(db, createRemote());

    await expect(
      repository.createTransfer(OFFLINE_OWNER, {
        ...dto,
        toWalletId: "wallet-1",
      }),
    ).rejects.toMatchObject({ code: "SAME_WALLET" });
  });

  it("rejects a missing source wallet", async () => {
    const repository = createRepository(db, createRemote());

    await expect(
      repository.createTransfer(OFFLINE_OWNER, {
        ...dto,
        fromWalletId: "missing",
      }),
    ).rejects.toMatchObject({ code: "FROM_WALLET_NOT_FOUND" });
  });

  it("rejects an orphaned source wallet", async () => {
    const repository = createRepository(db, createRemote());

    await expect(
      repository.createTransfer(OFFLINE_OWNER, {
        ...dto,
        fromWalletId: "-1",
      }),
    ).rejects.toMatchObject({ code: "FROM_WALLET_NOT_FOUND" });
  });

  it("rejects an orphaned destination wallet", async () => {
    const repository = createRepository(db, createRemote());

    await expect(
      repository.createTransfer(OFFLINE_OWNER, {
        ...dto,
        toWalletId: "-1",
      }),
    ).rejects.toMatchObject({ code: "TO_WALLET_NOT_FOUND" });
  });

  it("rejects a missing destination wallet", async () => {
    const repository = createRepository(db, createRemote());

    await expect(
      repository.createTransfer(OFFLINE_OWNER, {
        ...dto,
        toWalletId: "missing",
      }),
    ).rejects.toMatchObject({ code: "TO_WALLET_NOT_FOUND" });
  });

  it("rejects a wallet owned by another user", async () => {
    await seedWallet(db, { id: "wallet-3", ownerId: "owner-2" });
    const repository = createRepository(db, createRemote());

    await expect(
      repository.createTransfer(OFFLINE_OWNER, {
        ...dto,
        toWalletId: "wallet-3",
      }),
    ).rejects.toMatchObject({ code: "WALLET_NOT_OWNED" });
  });

  it("rejects a currency mismatch", async () => {
    const repository = createRepository(db, createRemote());

    await expect(
      repository.createTransfer(OFFLINE_OWNER, { ...dto, currency: "USD" }),
    ).rejects.toMatchObject({ code: "CURRENCY_MISMATCH" });
  });

  it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects an invalid amount (%p)",
    async (amount) => {
      const repository = createRepository(db, createRemote());

      await expect(
        repository.createTransfer(OFFLINE_OWNER, { ...dto, amount }),
      ).rejects.toMatchObject({ code: "TRANSFER_INVALID" });
    },
  );

  it("rejects insufficient funds against a pending expense", async () => {
    await seedWallet(db, { id: "wallet-1", balance: 50 });
    await new LocalOutboxRepository(db).enqueue({
      clientMutationId: "m-expense",
      ownerId: OFFLINE_OWNER,
      entityType: "transaction",
      entityId: "tx-pending",
      operation: "create",
      baseRevision: 0,
      localSnapshot: { type: "expense", amount: 40, walletId: "wallet-1" },
      now: "2026-11-20T09:00:00.000Z",
    });
    const repository = createRepository(db, createRemote());

    await expect(
      repository.createTransfer(OFFLINE_OWNER, { ...dto, amount: 20 }),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_FUNDS" });
    await expect(listOutbox(db)).resolves.toHaveLength(1);
  });

  it("accepts exactly the derived available balance", async () => {
    await seedWallet(db, { id: "wallet-1", balance: 50 });
    await new LocalOutboxRepository(db).enqueue({
      clientMutationId: "m-income",
      ownerId: OFFLINE_OWNER,
      entityType: "transaction",
      entityId: "tx-pending",
      operation: "create",
      baseRevision: 0,
      localSnapshot: { type: "income", amount: 10, walletId: "wallet-1" },
      now: "2026-11-20T09:00:00.000Z",
    });
    const repository = createRepository(db, createRemote());

    await expect(
      repository.createTransfer(OFFLINE_OWNER, { ...dto, amount: 60 }),
    ).resolves.toMatchObject({ transfer: { amount: 60 } });
  });
});
