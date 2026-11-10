import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryDocumentSnapshot } from "firebase/firestore";

import { Wallet } from "../../types/wallet.types";
import { orphanWalletMovementsAndDelete } from "../wallet-delete.orphan.operation";

const mockBatchUpdate = jest.fn<(...args: unknown[]) => void>();
const mockBatchDelete = jest.fn<(...args: unknown[]) => void>();
const mockBatchCommit = jest.fn<() => Promise<void>>();
const mockWriteBatch = jest.fn(() => ({
  update: mockBatchUpdate,
  delete: mockBatchDelete,
  commit: mockBatchCommit,
}));
const mockDoc = jest.fn((...args: unknown[]) => ({
  kind: args[1],
  id: args[2],
}));

jest.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  writeBatch: () => mockWriteBatch(),
}));

jest.mock("@/lib/firebase", () => ({ db: { name: "test-db" } }));

function movement(
  kind: string,
  id: string,
  data: Record<string, unknown>,
): QueryDocumentSnapshot {
  return {
    ref: { kind, id },
    data: () => data,
  } as unknown as QueryDocumentSnapshot;
}

const wallet: Wallet = {
  id: "wallet-1",
  name: "Cuenta principal",
  currency: "EUR",
  icon: "wallet",
  color: "#0A7EA4",
  initialBalance: 100,
  balance: 100,
  type: "bank",
  includeInTotal: true,
  ownerId: "user-1",
  createdAt: "2026-10-28T10:00:00.000Z",
  updatedAt: "2026-10-28T10:00:00.000Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockBatchCommit.mockResolvedValue();
});

describe("orphanWalletMovementsAndDelete", () => {
  it("moves each movement to the deleted placeholder and removes the wallet", async () => {
    const movements = {
      transactions: [
        movement("transaction", "tx-1", { walletId: "wallet-1", amount: 50 }),
      ],
      transfers: [
        movement("transfer", "tr-1", {
          fromWalletId: "wallet-1",
          toWalletId: "wallet-2",
          amount: 25,
        }),
        movement("transfer", "tr-2", {
          fromWalletId: "wallet-3",
          toWalletId: "wallet-1",
          amount: 10,
        }),
      ],
    };

    await orphanWalletMovementsAndDelete(wallet, movements);

    expect(mockBatchUpdate).toHaveBeenCalledWith(
      { kind: "transaction", id: "tx-1" },
      expect.objectContaining({
        walletId: "-1",
        walletName: "[Eliminada] Cuenta principal",
        updatedAt: expect.any(String),
      }),
    );
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      { kind: "transfer", id: "tr-1" },
      expect.objectContaining({
        fromWalletId: "-1",
        fromWalletName: "[Eliminada] Cuenta principal",
      }),
    );
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      { kind: "transfer", id: "tr-2" },
      expect.objectContaining({
        toWalletId: "-1",
        toWalletName: "[Eliminada] Cuenta principal",
      }),
    );
    expect(mockBatchDelete).toHaveBeenCalledWith({
      kind: "wallets",
      id: "wallet-1",
    });
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it("only replaces the matching side of a transfer", async () => {
    const movements = {
      transactions: [],
      transfers: [
        movement("transfer", "tr-1", {
          fromWalletId: "wallet-1",
          toWalletId: "wallet-2",
          amount: 25,
        }),
      ],
    };

    await orphanWalletMovementsAndDelete(wallet, movements);

    const patch = mockBatchUpdate.mock.calls[0][1] as Record<string, unknown>;
    expect(patch).not.toHaveProperty("toWalletId");
    expect(patch).not.toHaveProperty("toWalletName");
  });
});
