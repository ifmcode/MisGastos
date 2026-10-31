import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the repository.
import {
  fromWalletRef,
  setupTransferRepositoryMocks,
  snapshot,
  toWalletRef,
  transactionGet,
  transactionUpdate,
  transferDocument,
  validDto,
  walletDocument,
} from "./transfer-repository.test-helpers";
import { FirebaseTransferRepository } from "../firebase-transfer.repository";

beforeEach(setupTransferRepositoryMocks);

describe("FirebaseTransferRepository.updateTransfer", () => {
  it("reverts the old transfer and applies the new one atomically", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("transfer-1", transferDocument()))
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ balance: 100 })),
      )
      .mockResolvedValueOnce(
        snapshot("wallet-2", walletDocument({ balance: 50 })),
      );

    const repository = new FirebaseTransferRepository();
    const result = await repository.updateTransfer("user-1", "transfer-1", {
      ...validDto,
      amount: 40,
      notes: "  Nuevo concepto  ",
    });

    expect(transactionGet).toHaveBeenCalledWith({
      kind: "transfer",
      id: "transfer-1",
    });

    expect(transactionUpdate).toHaveBeenCalledWith(
      fromWalletRef,
      expect.objectContaining({ balance: 85.5, updatedAt: expect.any(String) }),
    );
    expect(transactionUpdate).toHaveBeenCalledWith(
      toWalletRef,
      expect.objectContaining({ balance: 64.5, updatedAt: expect.any(String) }),
    );
    expect(transactionUpdate).toHaveBeenCalledWith(
      { kind: "transfer", id: "transfer-1" },
      expect.objectContaining({
        fromWalletId: "wallet-1",
        toWalletId: "wallet-2",
        amount: 40,
        notes: "Nuevo concepto",
        createdAt: "2026-10-29T10:00:00.000Z",
        updatedAt: expect.any(String),
      }),
    );

    expect(result.transfer).toMatchObject({
      id: "transfer-1",
      amount: 40,
      notes: "Nuevo concepto",
      createdAt: "2026-10-29T10:00:00.000Z",
      ownerId: "user-1",
    });
    expect(result.wallets.map((wallet) => wallet.balance)).toEqual([
      85.5, 64.5,
    ]);
  });

  it("does not touch wallet balances when the financial data is unchanged", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("transfer-1", transferDocument()))
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ balance: 74.5 })),
      )
      .mockResolvedValueOnce(
        snapshot("wallet-2", walletDocument({ balance: 75.5 })),
      );

    const repository = new FirebaseTransferRepository();
    const result = await repository.updateTransfer("user-1", "transfer-1", {
      ...validDto,
      notes: "Solo cambian las notas",
    });

    expect(transactionUpdate).toHaveBeenCalledTimes(1);
    expect(transactionUpdate).toHaveBeenCalledWith(
      { kind: "transfer", id: "transfer-1" },
      expect.objectContaining({ notes: "Solo cambian las notas" }),
    );
    expect(result.wallets).toEqual([]);
  });
});
