import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the operation.
import {
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

describe("seedDefaultWalletDocument profile handling", () => {
  it("creates only the wallet when the profile is missing", async () => {
    mockOwnerQueries();
    mockTransactionDocuments();

    const result = await seedDefaultWalletDocument("user-1", seedDto);

    expect(result).toEqual({
      status: "seeded",
      wallet: expect.objectContaining({ id: seededWalletId, balance: 0 }),
    });
    expect(mockTransactionSet).toHaveBeenCalledTimes(1);
    expect(mockTransactionSet).toHaveBeenCalledWith(
      { kind: "wallets", id: seededWalletId },
      expect.objectContaining({ ownerId: "user-1" }),
    );
    // The wallets feature never creates or writes a `users` document, and a
    // missing document cannot be read: the rules deny it instead of not-found.
    expect(transactionReads()).toEqual([]);
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("writes nothing when the profile is missing and wallets already exist", async () => {
    mockOwnerQueries(undefined, [
      { id: "wallet-9", data: walletDocument({ ownerId: "user-1" }) },
    ]);
    mockTransactionDocuments();

    const result = await seedDefaultWalletDocument("user-1", seedDto);

    expect(result).toEqual({ status: "skipped-existing-wallets" });
    // The decision still belongs to the transaction even when there is nothing
    // to write, so two devices converge on the same outcome.
    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
    expect(mockTransactionSet).not.toHaveBeenCalled();
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
    expect(transactionReads()).toEqual([]);
  });

  it("never overwrites the profile name, email or currency", async () => {
    mockOwnerQueries([{ id: "profile-1", data: seedProfile }], [
      { id: "wallet-9", data: walletDocument({ ownerId: "user-1" }) },
    ]);
    mockTransactionDocuments({ "users/profile-1": seedProfile });

    await seedDefaultWalletDocument("user-1", seedDto);

    expect(mockTransactionSet).not.toHaveBeenCalled();
    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      { kind: "users", id: "profile-1" },
      {
        defaultWalletSeededAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    );
  });
});
