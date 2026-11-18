import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../repositories/firebase-friends.repository", () => ({
  FirebaseFriendsRepository: jest.fn(() => ({ kind: "friends-repository" })),
}));

const mockLedger = { kind: "friend-ledger" };

jest.mock("../../repositories/friend-ledger.factory", () => ({
  getFriendLedgerRepository: jest.fn(() => mockLedger),
}));

import { EmptyFriendLedgerRepository } from "../../repositories/friend-ledger.repository";
import { getFriendLedgerRepository } from "../../repositories/friend-ledger.factory";
import { getFriendsService } from "../friends.factory";

describe("getFriendsService", () => {
  it("reuses one FriendsService wired to the composed friend ledger", () => {
    const service = getFriendsService();

    expect(getFriendsService()).toBe(service);
    expect(getFriendLedgerRepository).toHaveBeenCalledTimes(1);
  });
});

describe("EmptyFriendLedgerRepository", () => {
  it("keeps producing no entries for isolated tests", async () => {
    await expect(
      new EmptyFriendLedgerRepository().getEntries("user-1"),
    ).resolves.toEqual([]);
  });
});
