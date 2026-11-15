import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../repositories/firebase-friends.repository", () => ({
  FirebaseFriendsRepository: jest.fn(() => ({ kind: "friends-repository" })),
}));

import { EmptyFriendLedgerRepository } from "../../repositories/friend-ledger.repository";
import { getFriendsService } from "../friends.factory";

describe("getFriendsService", () => {
  it("reuses one FriendsService instance", () => {
    const service = getFriendsService();

    expect(getFriendsService()).toBe(service);
  });
});

describe("EmptyFriendLedgerRepository", () => {
  it("reports no shared expenses or settlements yet", async () => {
    await expect(
      new EmptyFriendLedgerRepository().getEntries("user-1"),
    ).resolves.toEqual([]);
  });
});
