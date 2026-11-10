import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the operation.
import {
  mockTransactionDelete,
  mockTransactionGet,
  mockTransactionUpdate,
  movement,
  setupReassignMocks,
  sourceWallet,
  targetSnapshot,
  targetWallet,
} from "./wallet-delete.reassign.test-helpers";
import { reassignWalletMovementsAndDelete } from "../wallet-delete.reassign.operation";
import { WalletMovements } from "../wallet-movements";

beforeEach(setupReassignMocks);

function reassign(
  movements: WalletMovements = { transactions: [], transfers: [] },
) {
  return reassignWalletMovementsAndDelete(
    "user-1",
    sourceWallet,
    targetWallet,
    movements,
  );
}

describe("reassignWalletMovementsAndDelete guards", () => {
  it("rejects archived targets before touching any movement", async () => {
    mockTransactionGet.mockResolvedValue(
      targetSnapshot({ archivedAt: "2026-11-01T10:00:00.000Z" }),
    );

    await expect(reassign()).rejects.toMatchObject({
      code: "TARGET_WALLET_ARCHIVED",
    });
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
    expect(mockTransactionDelete).not.toHaveBeenCalled();
  });

  it("rejects targets owned by someone else", async () => {
    mockTransactionGet.mockResolvedValue(
      targetSnapshot({ ownerId: "other-user" }),
    );

    await expect(reassign()).rejects.toMatchObject({
      code: "WALLET_NOT_FOUND",
    });
    expect(mockTransactionDelete).not.toHaveBeenCalled();
  });

  it("rejects movements that would leave the target with a negative balance", async () => {
    mockTransactionGet.mockResolvedValue(targetSnapshot({ balance: 10 }));
    const movements = {
      transactions: [
        movement("transaction", "tx-out", {
          walletId: "wallet-1",
          type: "expense",
          amount: 100,
        }),
      ],
      transfers: [],
    };

    await expect(reassign(movements)).rejects.toMatchObject({
      code: "TARGET_WALLET_INSUFFICIENT_BALANCE",
    });
    expect(mockTransactionDelete).not.toHaveBeenCalled();
  });
});
