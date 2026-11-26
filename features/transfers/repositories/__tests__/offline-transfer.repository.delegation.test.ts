import { beforeEach, describe, expect, it } from "@jest/globals";

import { migrateLocalDatabase } from "@/shared/lib/local-db/database";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import type { Transfer } from "../../types/transfer.types";
import { toTransferLocalRow } from "../local-transfer.mapper";
import { buildTransfer } from "./local-transfer.fixtures";
import type { ITransferRepository } from "../transfer.repository";
import { OfflineTransferRepository } from "../offline-transfer.repository";
import {
  createRemote,
  createRepository,
  findOutboxMutation,
  listOutbox,
  OFFLINE_OWNER,
  readTransferRows,
  seedWallet,
} from "./offline-transfer.fixtures";

const dto = {
  fromWalletId: "wallet-1",
  toWalletId: "wallet-2",
  amount: 40,
  currency: "EUR" as const,
  date: "2026-11-20",
};

function remoteResult(): Awaited<
  ReturnType<ITransferRepository["createTransfer"]>
> {
  return { transfer: buildTransfer({ id: "remote" }), wallets: [] };
}

async function seedTransfer(
  db: InMemoryDatabase,
  overrides: Partial<Transfer> = {},
): Promise<void> {
  await db.upsert(
    "transfers",
    toTransferLocalRow(
      buildTransfer({ ownerId: OFFLINE_OWNER, ...overrides }),
    ),
  );
}

describe("OfflineTransferRepository reads and delegation", () => {
  let db: InMemoryDatabase;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
    await seedWallet(db, { id: "wallet-1", balance: 100 });
    await seedWallet(db, { id: "wallet-2", balance: 50, name: "Ahorros" });
  });

  it("delegates list reads to the phase-3 repository", async () => {
    const remote = createRemote();
    const repository = createRepository(db, remote);

    await repository.getTransfers(OFFLINE_OWNER);

    expect(remote.getTransfers).toHaveBeenCalledWith(OFFLINE_OWNER);
  });

  it("reads a local transfer before hitting the remote", async () => {
    const local = buildTransfer({ id: "local", ownerId: OFFLINE_OWNER });
    await seedTransfer(db, local);
    const remote = createRemote();
    const repository = createRepository(db, remote);

    await expect(repository.getTransfer(OFFLINE_OWNER, "local")).resolves.toMatchObject(
      { id: "local" },
    );
    expect(remote.getTransfer).not.toHaveBeenCalled();
  });

  it("falls back to the remote when the local transfer does not exist", async () => {
    const remote = createRemote();
    const remoteTransfer = buildTransfer({ id: "remote" });
    remote.getTransfer.mockResolvedValue(remoteTransfer);
    const repository = createRepository(db, remote);

    await expect(repository.getTransfer(OFFLINE_OWNER, "remote")).resolves.toBe(
      remoteTransfer,
    );
    expect(remote.getTransfer).toHaveBeenCalledWith(OFFLINE_OWNER, "remote");
  });

  it("returns null for a local soft-deleted transfer", async () => {
    await seedTransfer(db, {
      id: "deleted",
      ownerId: OFFLINE_OWNER,
      deletedAt: "2026-11-10T10:00:00.000Z",
    });
    const remote = createRemote();
    const repository = createRepository(db, remote);

    await expect(
      repository.getTransfer(OFFLINE_OWNER, "deleted"),
    ).resolves.toBeNull();
    expect(remote.getTransfer).not.toHaveBeenCalled();
  });

  it("falls back to the remote write path without a local port", async () => {
    const remote = createRemote();
    remote.createTransfer.mockResolvedValue(remoteResult());
    remote.updateTransfer.mockResolvedValue(remoteResult());
    remote.deleteTransfer.mockResolvedValue(remoteResult());
    remote.getTransfer.mockResolvedValue(null);
    const repository = createRepository(db, remote, {
      getPort: async () => null,
    });

    await repository.getTransfer(OFFLINE_OWNER, "transfer-1");
    await repository.createTransfer(OFFLINE_OWNER, dto);
    await repository.updateTransfer(OFFLINE_OWNER, "transfer-1", dto);
    await repository.deleteTransfer(OFFLINE_OWNER, "transfer-1");

    expect(remote.getTransfer).toHaveBeenCalledWith(OFFLINE_OWNER, "transfer-1");
    expect(remote.createTransfer).toHaveBeenCalledWith(OFFLINE_OWNER, dto);
    expect(remote.updateTransfer).toHaveBeenCalledWith(
      OFFLINE_OWNER,
      "transfer-1",
      dto,
    );
    expect(remote.deleteTransfer).toHaveBeenCalledWith(
      OFFLINE_OWNER,
      "transfer-1",
    );
    await expect(listOutbox(db)).resolves.toHaveLength(0);
  });

  it("delegates update and delete when the transfer is not local", async () => {
    const remote = createRemote();
    remote.updateTransfer.mockResolvedValue(remoteResult());
    remote.deleteTransfer.mockResolvedValue(remoteResult());
    const repository = createRepository(db, remote);

    await repository.updateTransfer(OFFLINE_OWNER, "missing", dto);
    await repository.deleteTransfer(OFFLINE_OWNER, "missing");

    expect(remote.updateTransfer).toHaveBeenCalledWith(
      OFFLINE_OWNER,
      "missing",
      dto,
    );
    expect(remote.deleteTransfer).toHaveBeenCalledWith(OFFLINE_OWNER, "missing");
  });

  it("uses the runtime clock and id factory when only the port is injected", async () => {
    const repository = new OfflineTransferRepository(createRemote(), {
      getPort: async () => db,
    });

    const result = await repository.createTransfer(OFFLINE_OWNER, dto);

    expect(result.transfer.id.length).toBeGreaterThan(0);
    expect(Number.isNaN(Date.parse(String(result.transfer.createdAt)))).toBe(
      false,
    );
  });

  it("falls back to the runtime port provider by default", async () => {
    delete process.env.EXPO_PUBLIC_OFFLINE_FIRST;
    const remote = createRemote();
    remote.createTransfer.mockResolvedValue(remoteResult());
    const repository = new OfflineTransferRepository(remote);

    await repository.createTransfer(OFFLINE_OWNER, dto);

    expect(remote.createTransfer).toHaveBeenCalledWith(OFFLINE_OWNER, dto);
  });

  it("keeps a pending transfer across a repository rebuild", async () => {
    const remote = createRemote();
    const first = createRepository(db, remote);
    const created = await first.createTransfer(OFFLINE_OWNER, dto);

    const second = createRepository(db, remote);
    await second.updateTransfer(OFFLINE_OWNER, created.transfer.id, {
      ...dto,
      amount: 30,
    });

    const [row] = await readTransferRows(db, created.transfer.id);
    expect(row?.amount).toBe(30);
    await expect(
      findOutboxMutation(db, created.transfer.id),
    ).resolves.toMatchObject({ operation: "create" });
  });
});
