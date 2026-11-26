import { beforeEach, describe, expect, it } from "@jest/globals";

import { migrateLocalDatabase } from "@/shared/lib/local-db/database";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import { TransactionOperationError } from "../../services/transaction.errors";
import type { CreateTransactionDto } from "../../types/transaction.types";
import { toTransactionLocalRow } from "../local-transaction.mapper";
import { buildTransaction } from "./local-transaction.fixtures";
import {
  createRemote,
  createRepository,
  findOutboxMutation,
  listOutbox,
  OFFLINE_OWNER,
  readTransactionRows,
  seedWallet,
} from "./offline-transaction.fixtures";

const dto: CreateTransactionDto = {
  type: "expense",
  amount: 25.5,
  currency: "EUR",
  walletId: "wallet-1",
  categoryId: "category-1",
  concept: "  Cena  ",
  notes: "  Cumpleaños  ",
  date: "2026-11-20",
};

describe("OfflineTransactionRepository create", () => {
  let db: InMemoryDatabase;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
    await seedWallet(db, { id: "wallet-1", balance: 100 });
  });

  it("writes a pending row and an outbox create in one transaction", async () => {
    const repository = createRepository(db, createRemote());

    const result = await repository.createTransaction(OFFLINE_OWNER, dto);

    expect(result.transaction).toMatchObject({
      id: "id-1",
      type: "expense",
      amount: 25.5,
      concept: "Cena",
      notes: "Cumpleaños",
      revision: 0,
      deletedAt: null,
    });
    expect(result.wallets.map((wallet) => wallet.balance)).toEqual([74.5]);

    const [row] = await readTransactionRows(db, "id-1");
    expect(row?.syncStatus).toBe("pending");
    expect(row?.revision).toBe(0);
    expect(row?.walletName).toBeNull();

    const mutation = await findOutboxMutation(db, "id-1");
    expect(mutation).toMatchObject({
      operation: "create",
      baseRevision: 0,
      serverSnapshot: {},
      ownerId: OFFLINE_OWNER,
      entityType: "transaction",
    });
    expect(mutation?.localSnapshot).toMatchObject({
      walletId: "wallet-1",
      type: "expense",
      amount: 25.5,
      revision: 0,
    });
  });

  it("uses a provided client id and a separate mutation id", async () => {
    const repository = createRepository(db, createRemote());

    const result = await repository.createTransaction(OFFLINE_OWNER, {
      ...dto,
      id: "client-tx",
    });

    expect(result.transaction.id).toBe("client-tx");
    await expect(findOutboxMutation(db, "client-tx")).resolves.toMatchObject({
      clientMutationId: "id-1",
    });
  });

  it("rejects an id that already exists for another owner", async () => {
    await db.upsert(
      "transactions",
      toTransactionLocalRow(
        buildTransaction({ id: "dup", ownerId: "owner-2" }),
      ),
    );
    const repository = createRepository(db, createRemote());

    await expect(
      repository.createTransaction(OFFLINE_OWNER, { ...dto, id: "dup" }),
    ).rejects.toMatchObject({ code: "TRANSACTION_INVALID" });

    await expect(listOutbox(db)).resolves.toHaveLength(0);
  });

  it("rejects a missing wallet with WALLET_NOT_FOUND", async () => {
    const repository = createRepository(db, createRemote());

    await expect(
      repository.createTransaction(OFFLINE_OWNER, {
        ...dto,
        walletId: "missing",
      }),
    ).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });
    await expect(listOutbox(db)).resolves.toHaveLength(0);
  });

  it("rejects another owner's wallet with WALLET_NOT_OWNED", async () => {
    await seedWallet(db, { id: "wallet-2", ownerId: "owner-2" });
    const repository = createRepository(db, createRemote());

    await expect(
      repository.createTransaction(OFFLINE_OWNER, {
        ...dto,
        walletId: "wallet-2",
      }),
    ).rejects.toMatchObject({ code: "WALLET_NOT_OWNED" });
  });

  it("rejects a currency mismatch", async () => {
    const repository = createRepository(db, createRemote());

    await expect(
      repository.createTransaction(OFFLINE_OWNER, {
        ...dto,
        currency: "USD",
      }),
    ).rejects.toMatchObject({ code: "CURRENCY_MISMATCH" });
  });

  it("rejects a malformed movement without writing anything", async () => {
    const repository = createRepository(db, createRemote());

    await expect(
      repository.createTransaction(OFFLINE_OWNER, { ...dto, concept: "  " }),
    ).rejects.toBeInstanceOf(TransactionOperationError);
    await expect(readTransactionRows(db)).resolves.toHaveLength(0);
    await expect(listOutbox(db)).resolves.toHaveLength(0);
  });

  it("keeps link ids only on their valid movement type", async () => {
    const repository = createRepository(db, createRemote());

    await repository.createTransaction(OFFLINE_OWNER, {
      ...dto,
      sharedExpenseId: "shared-1",
      groupExpenseId: "group-1",
      settlementId: "settlement-1",
      groupSettlementId: "group-settlement-1",
    });

    const [row] = await readTransactionRows(db, "id-1");
    expect(row?.sharedExpenseId).toBe("shared-1");
    expect(row?.groupExpenseId).toBe("group-1");
    expect(row?.settlementId).toBeNull();
    expect(row?.groupSettlementId).toBeNull();
  });

  it("keeps settlement links on an income", async () => {
    const repository = createRepository(db, createRemote());

    await repository.createTransaction(OFFLINE_OWNER, {
      ...dto,
      type: "income",
      settlementId: "settlement-1",
      groupSettlementId: "group-settlement-1",
      sharedExpenseId: "shared-1",
    });

    const [row] = await readTransactionRows(db, "id-1");
    expect(row?.settlementId).toBe("settlement-1");
    expect(row?.groupSettlementId).toBe("group-settlement-1");
    expect(row?.sharedExpenseId).toBeNull();
  });
});
