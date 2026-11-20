import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the operation.
import {
  mockGetDocs,
  mockRunTransaction,
  mockTransactionSet,
  mockTransactionUpdate,
  setupWalletRepositoryMocks,
  walletDocument,
} from "./wallet-repository.test-helpers";
import {
  mockOwnerQueries,
  mockTransactionDocuments,
  seededWalletId,
  seedDto,
  seedProfile,
  transactionReads,
} from "./wallet-seed.test-helpers";
import { seedDefaultWalletDocument } from "../wallet-seed.operation";

beforeEach(setupWalletRepositoryMocks);

describe("seedDefaultWalletDocument", () => {
  it("writes the wallet and the marker in the same transaction", async () => {
    mockOwnerQueries([{ id: "profile-1", data: seedProfile }]);
    mockTransactionDocuments({ "users/profile-1": seedProfile });

    const result = await seedDefaultWalletDocument("user-1", seedDto);

    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
    expect(mockTransactionSet).toHaveBeenCalledWith(
      { kind: "wallets", id: seededWalletId },
      expect.objectContaining({
        name: "Cartera principal",
        currency: "EUR",
        icon: "wallet",
        color: "#0A7EA4",
        initialBalance: 0,
        balance: 0,
        type: "cash",
        includeInTotal: true,
        ownerId: "user-1",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      { kind: "users", id: "profile-1" },
      {
        defaultWalletSeededAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    );
    expect(result).toEqual({
      status: "seeded",
      wallet: expect.objectContaining({
        id: seededWalletId,
        name: "Cartera principal",
        balance: 0,
        ownerId: "user-1",
      }),
    });
  });

  it("never reads the wallet document, only the existing profile", async () => {
    mockOwnerQueries([{ id: "profile-1", data: seedProfile }]);
    mockTransactionDocuments({ "users/profile-1": seedProfile });

    await seedDefaultWalletDocument("user-1", seedDto);

    expect(transactionReads()).toEqual([{ kind: "users", id: "profile-1" }]);
  });

  it("treats an empty marker as missing", async () => {
    const marked = { ...seedProfile, defaultWalletSeededAt: "" };
    mockOwnerQueries([{ id: "profile-1", data: marked }]);
    mockTransactionDocuments({ "users/profile-1": marked });

    const result = await seedDefaultWalletDocument("user-1", seedDto);

    expect(result.status).toBe("seeded");
    expect(mockTransactionSet).toHaveBeenCalledWith(
      { kind: "wallets", id: seededWalletId },
      expect.objectContaining({ ownerId: "user-1" }),
    );
  });

  it("is a no-op when the profile already carries the marker", async () => {
    const marked = {
      ...seedProfile,
      defaultWalletSeededAt: "2026-11-01T10:00:00.000Z",
    };
    mockOwnerQueries([{ id: "profile-1", data: marked }]);
    mockTransactionDocuments({ "users/profile-1": marked });

    const result = await seedDefaultWalletDocument("user-1", seedDto);

    expect(result).toEqual({ status: "already-seeded" });
    expect(mockTransactionSet).not.toHaveBeenCalled();
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("stamps the marker without creating a wallet when wallets exist", async () => {
    mockOwnerQueries(
      [{ id: "profile-1", data: seedProfile }],
      [
        {
          id: "wallet-9",
          data: walletDocument({ archivedAt: "2026-11-01T10:00:00.000Z" }),
        },
      ],
    );
    mockTransactionDocuments({ "users/profile-1": seedProfile });

    const result = await seedDefaultWalletDocument("user-1", seedDto);

    expect(result).toEqual({ status: "skipped-existing-wallets" });
    expect(mockTransactionSet).not.toHaveBeenCalled();
    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      { kind: "users", id: "profile-1" },
      {
        defaultWalletSeededAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    );
  });

  it("propagates a failure on the profile query", async () => {
    mockOwnerQueries();
    mockGetDocs.mockRejectedValue(new Error("permission-denied"));

    await expect(
      seedDefaultWalletDocument("user-1", seedDto),
    ).rejects.toThrow("permission-denied");
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });
});
