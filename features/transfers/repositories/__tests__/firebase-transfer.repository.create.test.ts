import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the repository.
import {
  fromWalletRef,
  mockCollection,
  mockDoc,
  mockRunTransaction,
  mockWalletSnapshots,
  setupTransferRepositoryMocks,
  toWalletRef,
  transactionGet,
  transactionSet,
  transactionUpdate,
  transferRef,
  validDto,
} from "./transfer-repository.test-helpers";
import { FirebaseTransferRepository } from "../firebase-transfer.repository";

beforeEach(setupTransferRepositoryMocks);

describe("FirebaseTransferRepository.createTransfer", () => {
  it("moves the money and stores the transfer inside one transaction", async () => {
    mockWalletSnapshots();

    const repository = new FirebaseTransferRepository();
    const result = await repository.createTransfer("user-1", validDto);

    expect(mockCollection).toHaveBeenCalledWith(
      { name: "test-db" },
      "transfers",
    );
    expect(mockDoc).toHaveBeenCalledWith(
      { name: "test-db" },
      "wallets",
      "wallet-1",
    );
    expect(mockDoc).toHaveBeenCalledWith(
      { name: "test-db" },
      "wallets",
      "wallet-2",
    );
    expect(mockRunTransaction).toHaveBeenCalledWith(
      { name: "test-db" },
      expect.any(Function),
    );

    expect(transactionGet).toHaveBeenCalledWith(fromWalletRef);
    expect(transactionGet).toHaveBeenCalledWith(toWalletRef);

    expect(transactionSet).toHaveBeenCalledWith(
      transferRef,
      expect.objectContaining({
        fromWalletId: "wallet-1",
        toWalletId: "wallet-2",
        amount: 25.5,
        currency: "EUR",
        date: "2026-10-29",
        notes: "Ahorro mensual",
        ownerId: "user-1",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );

    expect(transactionUpdate).toHaveBeenCalledWith(
      fromWalletRef,
      expect.objectContaining({ balance: 74.5, updatedAt: expect.any(String) }),
    );
    expect(transactionUpdate).toHaveBeenCalledWith(
      toWalletRef,
      expect.objectContaining({ balance: 125.5, updatedAt: expect.any(String) }),
    );

    expect(result.transfer).toMatchObject({
      id: "transfer-1",
      fromWalletId: "wallet-1",
      toWalletId: "wallet-2",
      amount: 25.5,
      currency: "EUR",
      date: "2026-10-29",
      notes: "Ahorro mensual",
      ownerId: "user-1",
    });
    expect(result.transfer.createdAt).toBe(result.transfer.updatedAt);
    expect(result.wallets.map((wallet) => wallet.id)).toEqual([
      "wallet-1",
      "wallet-2",
    ]);
    expect(result.wallets[0]?.balance).toBe(74.5);
    expect(result.wallets[1]?.balance).toBe(125.5);
  });

  it("does not store notes when they are empty", async () => {
    mockWalletSnapshots();

    const repository = new FirebaseTransferRepository();
    await repository.createTransfer("user-1", { ...validDto, notes: "   " });

    const payload = transactionSet.mock.calls[0]?.[1];

    expect(payload).not.toHaveProperty("notes");
  });
});
