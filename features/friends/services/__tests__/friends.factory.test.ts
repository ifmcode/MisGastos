import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../repositories/firebase-friends.repository", () => ({
  FirebaseFriendsRepository: jest.fn(() => ({ kind: "friends-repository" })),
}));

jest.mock(
  "@/features/shared-expenses/repositories/shared-expense-ledger.repository",
  () => ({
    SharedExpenseLedgerRepository: jest.fn(() => ({
      kind: "shared-expense-ledger-repository",
    })),
  }),
);

import { EmptyFriendLedgerRepository } from "../../repositories/friend-ledger.repository";
import { SharedExpenseLedgerRepository } from "@/features/shared-expenses/repositories/shared-expense-ledger.repository";
import { getFriendsService } from "../friends.factory";

describe("getFriendsService", () => {
  it("reuses one FriendsService instance wired to the expense ledger", () => {
    const service = getFriendsService();

    expect(getFriendsService()).toBe(service);
    expect(SharedExpenseLedgerRepository).toHaveBeenCalledTimes(1);
  });
});

describe("EmptyFriendLedgerRepository", () => {
  it("keeps producing no entries for isolated tests", async () => {
    await expect(
      new EmptyFriendLedgerRepository().getEntries("user-1"),
    ).resolves.toEqual([]);
  });
});
