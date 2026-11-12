import { beforeEach, describe, expect, it, jest } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the repository.
import {
  mockGetDoc,
  setupWalletRepositoryMocks,
  snapshot,
  walletDocument,
} from "./wallet-repository.test-helpers";
import { FirebaseWalletRepository } from "../firebase-wallet.repository";
import { deleteWalletDocument } from "../wallet-deletion.operation";
import { loadWalletMovements } from "../wallet-movements";
import {
  createWalletDocument,
  setWalletArchivedDocument,
  updateWalletDocument,
} from "../wallet-write.operations";

jest.mock("../wallet-write.operations", () => ({
  createWalletDocument: jest.fn(),
  setWalletArchivedDocument: jest.fn(),
  updateWalletDocument: jest.fn(),
}));
jest.mock("../wallet-deletion.operation", () => ({
  deleteWalletDocument: jest.fn(),
}));
jest.mock("../wallet-movements", () => ({
  loadWalletMovements: jest.fn(),
  toWalletUsage: (movements: { transactions: unknown[]; transfers: unknown[] }) => ({
    transactionCount: movements.transactions.length,
    transferCount: movements.transfers.length,
    hasMovements:
      movements.transactions.length + movements.transfers.length > 0,
  }),
}));

const createDocument = jest.mocked(createWalletDocument);
const updateDocument = jest.mocked(updateWalletDocument);
const archiveDocument = jest.mocked(setWalletArchivedDocument);
const deleteDocument = jest.mocked(deleteWalletDocument);
const loadMovements = jest.mocked(loadWalletMovements);

beforeEach(setupWalletRepositoryMocks);

describe("FirebaseWalletRepository.getWallet", () => {
  it("returns an owned wallet", async () => {
    mockGetDoc.mockResolvedValue(snapshot("wallet-1", walletDocument()));

    const repository = new FirebaseWalletRepository();
    const wallet = await repository.getWallet("user-1", "wallet-1");

    expect(wallet).toMatchObject({ id: "wallet-1", ownerId: "user-1" });
  });

  it("returns null for missing or foreign wallets", async () => {
    const repository = new FirebaseWalletRepository();

    mockGetDoc.mockResolvedValueOnce(snapshot("wallet-1"));
    await expect(
      repository.getWallet("user-1", "wallet-1"),
    ).resolves.toBeNull();

    mockGetDoc.mockResolvedValueOnce(
      snapshot("wallet-1", walletDocument({ ownerId: "user-2" })),
    );
    await expect(
      repository.getWallet("user-1", "wallet-1"),
    ).resolves.toBeNull();
  });
});

describe("FirebaseWalletRepository delegation", () => {
  it("delegates the write operations", async () => {
    const wallet = { id: "wallet-1" } as never;
    createDocument.mockResolvedValue(wallet);
    updateDocument.mockResolvedValue(wallet);
    archiveDocument.mockResolvedValue(wallet);
    deleteDocument.mockResolvedValue({ deletedWalletId: "wallet-1" });

    const repository = new FirebaseWalletRepository();
    const dto = { name: "Cuenta" } as never;

    await repository.createWallet("user-1", dto);
    await repository.updateWallet("user-1", "wallet-1", dto);
    await repository.setWalletArchived("user-1", "wallet-1", null);
    await repository.deleteWallet("user-1", "wallet-1", { mode: "keep" });

    expect(createDocument).toHaveBeenCalledWith("user-1", dto);
    expect(updateDocument).toHaveBeenCalledWith("user-1", "wallet-1", dto);
    expect(archiveDocument).toHaveBeenCalledWith("user-1", "wallet-1", null);
    expect(deleteDocument).toHaveBeenCalledWith("user-1", "wallet-1", {
      mode: "keep",
    });
  });

  it("derives usage from the loaded movements", async () => {
    loadMovements.mockResolvedValue({
      transactions: [{} as never],
      transfers: [{} as never, {} as never],
    });

    const repository = new FirebaseWalletRepository();
    const usage = await repository.getWalletUsage("user-1", "wallet-1");

    expect(usage).toEqual({
      transactionCount: 1,
      transferCount: 2,
      hasMovements: true,
    });
  });
});
