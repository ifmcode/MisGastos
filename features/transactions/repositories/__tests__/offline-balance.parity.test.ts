import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { migrateLocalDatabase } from "@/shared/lib/local-db/database";
import { InMemoryDatabase } from "@/shared/lib/local-db/in-memory.database";
import { applyTransactionToBalance } from "@/shared/utils/transaction-balance";
import { applyTransferToBalances } from "@/features/transfers/utils/transfer-balance";
import { readWalletsWithPendingBalance } from "@/features/wallets/repositories/local-wallet.balances";
import { OfflineTransferRepository } from "@/features/transfers/repositories/offline-transfer.repository";
import type { ITransferRepository } from "@/features/transfers/repositories/transfer.repository";

import { OfflineTransactionRepository } from "../offline-transaction.repository";
import type { ITransactionRepository } from "../transaction.repository";
import {
  OFFLINE_OWNER,
  OFFLINE_NOW,
  seedWallet,
} from "./offline-transaction.fixtures";

function transactionReader(): jest.Mocked<ITransactionRepository> {
  return {
    getTransactions: jest.fn(),
    createTransaction: jest.fn(),
    updateTransaction: jest.fn(),
    deleteTransaction: jest.fn(),
  };
}

function transferReader(): jest.Mocked<ITransferRepository> {
  return {
    getTransfers: jest.fn(),
    getTransfer: jest.fn(),
    createTransfer: jest.fn(),
    updateTransfer: jest.fn(),
    deleteTransfer: jest.fn(),
  };
}

describe("offline balance parity", () => {
  let db: InMemoryDatabase;

  beforeEach(async () => {
    db = new InMemoryDatabase();
    await migrateLocalDatabase(db);
    await seedWallet(db, { id: "wallet-1", balance: 100 });
    await seedWallet(db, { id: "wallet-2", balance: 50, name: "Ahorros" });
  });

  it("matches the online helpers after expense, income and transfer", async () => {
    const transactions = new OfflineTransactionRepository(transactionReader(), {
      getPort: async () => db,
      now: () => OFFLINE_NOW,
      createId: (() => {
        let counter = 0;
        return () => `tx-${++counter}`;
      })(),
    });
    const transfers = new OfflineTransferRepository(transferReader(), {
      getPort: async () => db,
      now: () => OFFLINE_NOW,
      createId: (() => {
        let counter = 0;
        return () => `transfer-${++counter}`;
      })(),
    });

    await transactions.createTransaction(OFFLINE_OWNER, {
      type: "expense",
      amount: 25.5,
      currency: "EUR",
      walletId: "wallet-1",
      categoryId: "category-1",
      concept: "Cena",
      date: "2026-11-20",
    });
    await transactions.createTransaction(OFFLINE_OWNER, {
      type: "income",
      amount: 10,
      currency: "EUR",
      walletId: "wallet-1",
      categoryId: "category-2",
      concept: "Devolución",
      date: "2026-11-20",
    });
    await transfers.createTransfer(OFFLINE_OWNER, {
      fromWalletId: "wallet-1",
      toWalletId: "wallet-2",
      amount: 40,
      currency: "EUR",
      date: "2026-11-20",
    });

    const wallets = await readWalletsWithPendingBalance(
      db,
      OFFLINE_OWNER,
    );
    const balances = new Map(
      wallets.map((wallet) => [wallet.id, wallet.balance]),
    );

    const afterExpense = applyTransactionToBalance(100, {
      type: "expense",
      amount: 25.5,
    });
    const afterIncome = applyTransactionToBalance(afterExpense, {
      type: "income",
      amount: 10,
    });
    const expected = applyTransferToBalances(afterIncome, 50, 40);

    expect(balances.get("wallet-1")).toBe(expected.fromBalance);
    expect(balances.get("wallet-2")).toBe(expected.toBalance);
  });
});
