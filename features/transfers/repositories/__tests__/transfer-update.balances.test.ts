import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  setupTransferRepositoryMocks,
  walletDocument,
} from "./transfer-repository.test-helpers";
import { applyTransferBalanceUpdates } from "../transfer-update.balances";

const transactionUpdate = jest.fn<(...args: unknown[]) => void>();

function run(
  overrides: Partial<Parameters<typeof applyTransferBalanceUpdates>[0]> = {},
) {
  return applyTransferBalanceUpdates({
    transaction: { update: transactionUpdate } as never,
    ownerId: "user-1",
    now: "2026-11-24T10:00:00.000Z",
    walletIds: ["wallet-1", "wallet-2"],
    walletDataById: new Map([
      ["wallet-1", walletDocument({ balance: 100 })],
      ["wallet-2", walletDocument({ balance: 50 })],
    ]),
    adjustments: new Map([["wallet-1", -25]]),
    fromWalletId: "wallet-1",
    ...overrides,
  });
}

beforeEach(setupTransferRepositoryMocks);

describe("applyTransferBalanceUpdates", () => {
  it("writes only the wallets with an adjustment and bumps their revision", () => {
    const wallets = run();

    expect(transactionUpdate).toHaveBeenCalledTimes(1);
    expect(transactionUpdate).toHaveBeenCalledWith(
      { kind: "wallet", id: "wallet-1" },
      expect.objectContaining({ balance: 75, revision: 1 }),
    );
    expect(wallets.map((wallet) => wallet.id)).toEqual(["wallet-1"]);
  });

  it("returns no wallets when nothing changes", () => {
    expect(run({ adjustments: new Map() })).toEqual([]);
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects a negative source balance", () => {
    expect(() =>
      run({ adjustments: new Map([["wallet-1", -150]]) }),
    ).toThrow(expect.objectContaining({ code: "INSUFFICIENT_FUNDS" }));
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("skips the negative check for an orphaned source side", () => {
    expect(() =>
      run({
        fromWalletId: "-1",
        walletIds: ["wallet-2"],
        adjustments: new Map([["wallet-2", -80]]),
      }),
    ).not.toThrow();
  });

  it("ignores a wallet with an adjustment but no loaded document", () => {
    const wallets = run({
      walletIds: ["wallet-1", "wallet-missing"],
      adjustments: new Map([["wallet-missing", 10]]),
    });

    expect(wallets).toEqual([]);
    expect(transactionUpdate).not.toHaveBeenCalled();
  });
});
