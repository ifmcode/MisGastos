import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the repository.
import {
  mockBatchCommit,
  mockBatchUpdate,
  mockCollection,
  mockGetDocs,
  mockWhere,
  mockWriteBatch,
  setupWalletRepositoryMocks,
  walletDocument,
} from "./wallet-repository.test-helpers";
import { FirebaseWalletRepository } from "../firebase-wallet.repository";

function ownedWallet(id: string, revision?: number) {
  return {
    id,
    data: () => walletDocument(revision === undefined ? {} : { revision }),
  };
}

beforeEach(setupWalletRepositoryMocks);

describe("FirebaseWalletRepository.updateWalletOrders", () => {
  it("reads the owner's wallets once and bumps every revision", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        ownedWallet("wallet-1", 2),
        ownedWallet("wallet-2"),
        { id: "broken", data: () => ({ name: "" }) },
      ],
    });

    const repository = new FirebaseWalletRepository();
    await repository.updateWalletOrders("user-1", [
      { id: "wallet-1", sortOrder: 0 },
      { id: "wallet-2", sortOrder: 1 },
    ]);

    expect(mockCollection).toHaveBeenCalledWith({ name: "test-db" }, "wallets");
    expect(mockWhere).toHaveBeenCalledWith("ownerId", "==", "user-1");
    expect(mockGetDocs).toHaveBeenCalledTimes(1);
    expect(mockWriteBatch).toHaveBeenCalledTimes(1);
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      { kind: "wallets", id: "wallet-1" },
      expect.objectContaining({
        sortOrder: 0,
        updatedAt: expect.any(String),
        revision: 3,
      }),
    );
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      { kind: "wallets", id: "wallet-2" },
      expect.objectContaining({
        sortOrder: 1,
        updatedAt: expect.any(String),
        revision: 1,
      }),
    );
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it("skips entries without a stored wallet", async () => {
    mockGetDocs.mockResolvedValue({ docs: [ownedWallet("wallet-1", 4)] });

    const repository = new FirebaseWalletRepository();
    await repository.updateWalletOrders("user-1", [
      { id: "wallet-1", sortOrder: 0 },
      { id: "wallet-missing", sortOrder: 1 },
    ]);

    expect(mockBatchUpdate).toHaveBeenCalledTimes(1);
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      { kind: "wallets", id: "wallet-1" },
      expect.objectContaining({ revision: 5 }),
    );
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it("returns without reading or writing for an empty update list", async () => {
    const repository = new FirebaseWalletRepository();
    await repository.updateWalletOrders("user-1", []);

    expect(mockGetDocs).not.toHaveBeenCalled();
    expect(mockWriteBatch).not.toHaveBeenCalled();
    expect(mockBatchCommit).not.toHaveBeenCalled();
  });

  it("does not commit when every entry is stale", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    const repository = new FirebaseWalletRepository();
    await repository.updateWalletOrders("user-1", [
      { id: "wallet-missing", sortOrder: 0 },
    ]);

    expect(mockGetDocs).toHaveBeenCalledTimes(1);
    expect(mockBatchUpdate).not.toHaveBeenCalled();
    expect(mockBatchCommit).not.toHaveBeenCalled();
  });

  it("propagates a batch commit failure", async () => {
    const failure = new Error("permission-denied");
    mockGetDocs.mockResolvedValue({ docs: [ownedWallet("wallet-1")] });
    mockBatchCommit.mockRejectedValueOnce(failure);

    const repository = new FirebaseWalletRepository();

    await expect(
      repository.updateWalletOrders("user-1", [
        { id: "wallet-1", sortOrder: 0 },
      ]),
    ).rejects.toBe(failure);
  });
});
