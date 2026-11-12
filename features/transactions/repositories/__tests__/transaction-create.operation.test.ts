import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  mockDoc,
  mockGetDoc,
  mockRunTransaction,
  setupTransactionRepositoryMocks,
  snapshot,
  transactionGet,
  transactionRef,
  transactionSet,
  transactionUpdate,
  validDto,
  walletDocument,
  walletRef,
} from "./transaction-repository.test-helpers";
import { createTransactionOperation } from "../transaction-create.operation";

beforeEach(setupTransactionRepositoryMocks);

function mockCreatedWallet(overrides: Record<string, unknown> = {}) {
  mockGetDoc.mockResolvedValue(
    snapshot("wallet-1", walletDocument({ balance: 74.5, ...overrides })),
  );
}

describe("createTransactionOperation", () => {
  it("stores the movement and subtracts the expense from the wallet", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot("wallet-1", walletDocument({ balance: 100 })),
    );
    mockCreatedWallet();

    const result = await createTransactionOperation("user-1", validDto);

    expect(mockDoc).toHaveBeenCalledWith(
      { name: "test-db" },
      "wallets",
      "wallet-1",
    );
    expect(mockRunTransaction).toHaveBeenCalledWith(
      { name: "test-db" },
      expect.any(Function),
    );
    expect(transactionSet).toHaveBeenCalledWith(
      transactionRef,
      expect.objectContaining({
        type: "expense",
        amount: 25.5,
        concept: "Supermercado",
        notes: "Compra semanal",
        ownerId: "user-1",
      }),
    );
    expect(transactionUpdate).toHaveBeenCalledWith(
      walletRef,
      expect.objectContaining({ balance: 74.5, updatedAt: expect.any(String) }),
    );
    expect(result.transaction).toMatchObject({
      id: "transaction-1",
      type: "expense",
      amount: 25.5,
      concept: "Supermercado",
      ownerId: "user-1",
    });
    expect(result.wallets.map((wallet) => wallet.balance)).toEqual([74.5]);
  });

  it("adds income to the wallet", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot("wallet-1", walletDocument({ balance: 100 })),
    );
    mockCreatedWallet({ balance: 110 });

    await createTransactionOperation("user-1", {
      ...validDto,
      type: "income",
      amount: 10,
    });

    expect(transactionUpdate).toHaveBeenCalledWith(
      walletRef,
      expect.objectContaining({ balance: 110 }),
    );
  });

  it("returns no wallets when the updated wallet cannot be mapped", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot("wallet-1", walletDocument()),
    );
    mockGetDoc.mockResolvedValue(snapshot("wallet-1"));

    const result = await createTransactionOperation("user-1", validDto);

    expect(result.wallets).toEqual([]);
  });

  it("rejects a missing wallet", async () => {
    transactionGet.mockResolvedValueOnce(snapshot("wallet-1"));

    await expect(
      createTransactionOperation("user-1", validDto),
    ).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });
  });

  it("rejects a wallet owned by another user", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot("wallet-1", walletDocument({ ownerId: "user-2" })),
    );

    await expect(
      createTransactionOperation("user-1", validDto),
    ).rejects.toMatchObject({ code: "WALLET_NOT_OWNED" });
  });

  it("rejects a currency mismatch", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot("wallet-1", walletDocument({ currency: "USD" })),
    );

    await expect(
      createTransactionOperation("user-1", validDto),
    ).rejects.toMatchObject({ code: "CURRENCY_MISMATCH" });
    expect(transactionSet).not.toHaveBeenCalled();
  });
});
