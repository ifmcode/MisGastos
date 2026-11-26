import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { migrateLocalDatabase } from "@/shared/lib/local-db/database";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import type { Transaction } from "../../types/transaction.types";
import { toTransactionLocalRow } from "../local-transaction.mapper";
import { buildTransaction } from "./local-transaction.fixtures";
import type { ITransactionRepository } from "../transaction.repository";
import { OfflineTransactionRepository } from "../offline-transaction.repository";
import {
  createRemote,
  createRepository,
  findOutboxMutation,
  listOutbox,
  OFFLINE_OWNER,
  readTransactionRows,
  seedWallet,
} from "./offline-transaction.fixtures";

const dto = {
  type: "expense" as const,
  amount: 10,
  currency: "EUR" as const,
  walletId: "wallet-1",
  categoryId: "category-1",
  concept: "Cena",
  date: "2026-11-20",
};

function remoteResult(): Awaited<
  ReturnType<ITransactionRepository["createTransaction"]>
> {
  return { transaction: buildTransaction({ id: "remote" }), wallets: [] };
}

describe("OfflineTransactionRepository delegation and persistence", () => {
  let db: InMemoryDatabase;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
    await seedWallet(db, { id: "wallet-1", balance: 100 });
  });

  it("delegates reads to the phase-3 repository", async () => {
    const remote = createRemote();
    const reader = createRepository(db, remote);

    await reader.getTransactions(OFFLINE_OWNER);

    expect(remote.getTransactions).toHaveBeenCalledWith(OFFLINE_OWNER);
  });

  it("falls back to the remote write path without a local port", async () => {
    const remote = createRemote();
    remote.createTransaction.mockResolvedValue(remoteResult());
    remote.updateTransaction.mockResolvedValue(remoteResult());
    remote.deleteTransaction.mockResolvedValue(remoteResult());
    const repository = createRepository(db, remote, {
      getPort: async () => null,
    });

    await repository.createTransaction(OFFLINE_OWNER, dto);
    await repository.updateTransaction(OFFLINE_OWNER, "tx-1", dto);
    await repository.deleteTransaction(OFFLINE_OWNER, "tx-1");

    expect(remote.createTransaction).toHaveBeenCalledWith(OFFLINE_OWNER, dto);
    expect(remote.updateTransaction).toHaveBeenCalledWith(
      OFFLINE_OWNER,
      "tx-1",
      dto,
    );
    expect(remote.deleteTransaction).toHaveBeenCalledWith(OFFLINE_OWNER, "tx-1");
    await expect(listOutbox(db)).resolves.toHaveLength(0);
  });

  it("delegates update and delete when the row is not local", async () => {
    const remote = createRemote();
    remote.updateTransaction.mockResolvedValue(remoteResult());
    remote.deleteTransaction.mockResolvedValue(remoteResult());
    const repository = createRepository(db, remote);

    await repository.updateTransaction(OFFLINE_OWNER, "missing", dto);
    await repository.deleteTransaction(OFFLINE_OWNER, "missing");

    expect(remote.updateTransaction).toHaveBeenCalledWith(
      OFFLINE_OWNER,
      "missing",
      dto,
    );
    expect(remote.deleteTransaction).toHaveBeenCalledWith(
      OFFLINE_OWNER,
      "missing",
    );
  });

  it("uses the runtime clock and id factory when only the port is injected", async () => {
    const repository = new OfflineTransactionRepository(createRemote(), {
      getPort: async () => db,
    });

    const result = await repository.createTransaction(OFFLINE_OWNER, dto);

    expect(result.transaction.id.length).toBeGreaterThan(0);
    expect(
      Number.isNaN(Date.parse(String(result.transaction.createdAt))),
    ).toBe(false);
  });

  it("falls back to the runtime port provider by default", async () => {
    delete process.env.EXPO_PUBLIC_OFFLINE_FIRST;
    const remote = createRemote();
    remote.createTransaction.mockResolvedValue(remoteResult());
    const repository = new OfflineTransactionRepository(remote);

    await repository.createTransaction(OFFLINE_OWNER, dto);

    expect(remote.createTransaction).toHaveBeenCalledWith(OFFLINE_OWNER, dto);
  });

  it("keeps a pending write across a repository rebuild", async () => {
    const remote = createRemote();
    const first = createRepository(db, remote);
    const created = await first.createTransaction(OFFLINE_OWNER, dto);

    const second = createRepository(db, remote);
    await second.updateTransaction(OFFLINE_OWNER, created.transaction.id, {
      ...dto,
      amount: 5,
    });

    const [row] = await readTransactionRows(db, created.transaction.id);
    expect(row?.amount).toBe(5);
    await expect(
      findOutboxMutation(db, created.transaction.id),
    ).resolves.toMatchObject({ operation: "create" });
  });

  it("does not persist a pending create when the local transaction fails", async () => {
    const remote = createRemote();
    const repository = createRepository(db, remote);
    const upsert = jest.spyOn(db, "upsert");
    upsert.mockRejectedValueOnce(new Error("disk full"));

    await expect(
      repository.createTransaction(OFFLINE_OWNER, dto),
    ).rejects.toThrow("disk full");

    await expect(readTransactionRows(db)).resolves.toHaveLength(0);
    await expect(listOutbox(db)).resolves.toHaveLength(0);
  });
});
