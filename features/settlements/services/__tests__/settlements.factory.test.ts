import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../repositories/firebase-settlements.repository", () => ({
  FirebaseSettlementsRepository: jest.fn(() => ({ kind: "settlements" })),
}));

jest.mock("@/features/friends/repositories/firebase-friends.repository", () => ({
  FirebaseFriendsRepository: jest.fn(() => ({ kind: "friends" })),
}));

jest.mock("@/features/friends/repositories/friend-ledger.factory", () => ({
  getFriendLedgerRepository: jest.fn(() => ({ kind: "ledger" })),
}));

import { FirebaseFriendsRepository } from "@/features/friends/repositories/firebase-friends.repository";
import { getFriendLedgerRepository } from "@/features/friends/repositories/friend-ledger.factory";
import { FirebaseSettlementsRepository } from "../../repositories/firebase-settlements.repository";
import { getSettlementsService } from "../settlements.factory";

describe("getSettlementsService", () => {
  it("reuses one service wired to Firestore and the composed ledger", () => {
    const service = getSettlementsService();

    expect(getSettlementsService()).toBe(service);
    expect(FirebaseSettlementsRepository).toHaveBeenCalledTimes(1);
    expect(FirebaseFriendsRepository).toHaveBeenCalledTimes(1);
    expect(getFriendLedgerRepository).toHaveBeenCalledTimes(1);
  });
});
