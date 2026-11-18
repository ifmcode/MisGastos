import { describe, expect, it, jest } from "@jest/globals";

jest.mock(
  "@/features/shared-expenses/repositories/shared-expense-ledger.repository",
  () => ({
    SharedExpenseLedgerRepository: jest.fn(() => ({ kind: "expenses" })),
  }),
);

jest.mock(
  "@/features/settlements/repositories/settlement-ledger.repository",
  () => ({
    SettlementLedgerRepository: jest.fn(() => ({ kind: "settlements" })),
  }),
);

const mockComposed = jest.fn(() => ({ kind: "composed" }));

jest.mock("../composed-friend-ledger.repository", () => ({
  ComposedFriendLedgerRepository: mockComposed,
}));

import { SharedExpenseLedgerRepository } from "@/features/shared-expenses/repositories/shared-expense-ledger.repository";
import { SettlementLedgerRepository } from "@/features/settlements/repositories/settlement-ledger.repository";
import { ComposedFriendLedgerRepository } from "../composed-friend-ledger.repository";
import { getFriendLedgerRepository } from "../friend-ledger.factory";

describe("getFriendLedgerRepository", () => {
  it("composes the expense and settlement sources once", () => {
    const ledger = getFriendLedgerRepository();

    expect(getFriendLedgerRepository()).toBe(ledger);
    expect(SharedExpenseLedgerRepository).toHaveBeenCalledTimes(1);
    expect(SettlementLedgerRepository).toHaveBeenCalledTimes(1);
    expect(ComposedFriendLedgerRepository).toHaveBeenCalledWith([
      { kind: "expenses" },
      { kind: "settlements" },
    ]);
  });
});
