import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the module.
import {
  mockCollection,
  mockGetDocs,
  movement,
  setupWalletRepositoryMocks,
} from "./wallet-repository.test-helpers";
import { loadWalletMovements, toWalletUsage } from "../wallet-movements";

beforeEach(setupWalletRepositoryMocks);

describe("loadWalletMovements", () => {
  it("keeps only the movements that reference the wallet", async () => {
    mockGetDocs
      .mockResolvedValueOnce({
        docs: [
          movement("transaction", "tx-1", { walletId: "wallet-1" }),
          movement("transaction", "tx-2", { walletId: "wallet-2" }),
          movement("transaction", "tx-3", { walletId: 42 }),
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          movement("transfer", "tr-from", { fromWalletId: "wallet-1" }),
          movement("transfer", "tr-to", { toWalletId: "wallet-1" }),
          movement("transfer", "tr-deleted", {
            fromWalletId: "wallet-1",
            deletedAt: "2026-11-01T10:00:00.000Z",
          }),
          movement("transfer", "tr-other", {
            fromWalletId: "wallet-2",
            toWalletId: "wallet-3",
          }),
        ],
      });

    const movements = await loadWalletMovements("user-1", "wallet-1");

    expect(mockCollection).toHaveBeenCalledWith(
      { name: "test-db" },
      "transactions",
    );
    expect(mockCollection).toHaveBeenCalledWith(
      { name: "test-db" },
      "transfers",
    );
    expect(movements.transactions.map((item) => item.id)).toEqual(["tx-1"]);
    expect(movements.transfers.map((item) => item.id)).toEqual([
      "tr-from",
      "tr-to",
    ]);
  });
});

describe("toWalletUsage", () => {
  it("summarizes whether the wallet has movements", () => {
    expect(
      toWalletUsage({ transactions: [], transfers: [] }),
    ).toEqual({ transactionCount: 0, transferCount: 0, hasMovements: false });

    const one = movement("transaction", "tx-1", {});
    const two = movement("transfer", "tr-1", {});
    expect(toWalletUsage({ transactions: [one], transfers: [two] })).toEqual({
      transactionCount: 1,
      transferCount: 1,
      hasMovements: true,
    });
  });
});
