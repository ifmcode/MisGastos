import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const getFriendships = jest.fn(async () => [
  { id: "a__b", memberIds: ["a", "b"], requesterId: "a", recipientId: "b", createdAt: "now" },
]);
const getFriendRequests = jest.fn(async () => []);
const getPublicProfiles = jest.fn<(...args: unknown[]) => Promise<unknown[]>>(async () => [
  { uid: "b", displayName: "B", email: "b@x", createdAt: "now", updatedAt: "now" },
]);
const getGroups = jest.fn(async () => [
  {
    id: "a__g",
    ownerId: "a",
    createdBy: "a",
    memberIds: ["a", "b"],
    name: "G",
    description: null,
    defaultCurrency: "EUR",
    joinCode: "ABCD2345",
    simplifyDebts: true,
    createdAt: "now",
    updatedAt: "now",
  },
]);
const getExpenses = jest.fn(async () => []);
const getSettlements = jest.fn(async () => []);
const getGroupExpenses = jest.fn(async () => []);
const getGroupSettlements = jest.fn(async () => []);

jest.mock("@/features/friends/repositories/firebase-friends.repository", () => ({
  FirebaseFriendsRepository: jest.fn(() => ({
    getFriendships,
    getFriendRequests,
    getPublicProfiles,
  })),
}));
jest.mock("@/features/groups/repositories/firebase-groups.repository", () => ({
  FirebaseGroupsRepository: jest.fn(() => ({ getGroups })),
}));
jest.mock(
  "@/features/shared-expenses/repositories/firebase-shared-expenses.repository",
  () => ({ FirebaseSharedExpensesRepository: jest.fn(() => ({ getExpenses })) }),
);
jest.mock(
  "@/features/settlements/repositories/firebase-settlements.repository",
  () => ({ FirebaseSettlementsRepository: jest.fn(() => ({ getSettlements })) }),
);
jest.mock(
  "@/features/group-expenses/repositories/firebase-group-expenses.repository",
  () => ({ FirebaseGroupExpensesRepository: jest.fn(() => ({ getGroupExpenses })) }),
);
jest.mock(
  "@/features/group-expenses/repositories/firebase-group-settlements.repository",
  () => ({
    FirebaseGroupSettlementsRepository: jest.fn(() => ({ getGroupSettlements })),
  }),
);

const cacheFriendships = jest.fn<(...args: unknown[]) => Promise<void>>(async () => {});
const cacheFriendRequests = jest.fn<(...args: unknown[]) => Promise<void>>(async () => {});
const cachePublicProfiles = jest.fn<(...args: unknown[]) => Promise<void>>(async () => {});
const cacheGroups = jest.fn<(...args: unknown[]) => Promise<void>>(async () => {});
const cacheSharedExpenses = jest.fn<(...args: unknown[]) => Promise<void>>(async () => {});
const cacheSettlements = jest.fn<(...args: unknown[]) => Promise<void>>(async () => {});
const cacheGroupExpenses = jest.fn<(...args: unknown[]) => Promise<void>>(async () => {});
const cacheGroupSettlements = jest.fn<(...args: unknown[]) => Promise<void>>(async () => {});

jest.mock("@/features/friends/repositories/local-friends.cache", () => ({
  cacheFriendships: (...a: unknown[]) => cacheFriendships(...a),
  cacheFriendRequests: (...a: unknown[]) => cacheFriendRequests(...a),
  cachePublicProfiles: (...a: unknown[]) => cachePublicProfiles(...a),
}));
jest.mock("@/features/groups/repositories/local-groups.cache", () => ({
  cacheGroups: (...a: unknown[]) => cacheGroups(...a),
}));
jest.mock("@/features/shared-expenses/repositories/local-shared-expense.cache", () => ({
  cacheSharedExpenses: (...a: unknown[]) => cacheSharedExpenses(...a),
}));
jest.mock("@/features/settlements/repositories/local-settlement.cache", () => ({
  cacheSettlements: (...a: unknown[]) => cacheSettlements(...a),
}));
jest.mock("@/features/group-expenses/repositories/local-group-expense.cache", () => ({
  cacheGroupExpenses: (...a: unknown[]) => cacheGroupExpenses(...a),
}));
jest.mock("@/features/group-expenses/repositories/local-group-settlement.cache", () => ({
  cacheGroupSettlements: (...a: unknown[]) => cacheGroupSettlements(...a),
}));

import { pullSocialData } from "../sync-social-pull";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("pullSocialData", () => {
  it("mirrors the social lookups, movements and the members' profiles", async () => {
    await pullSocialData("a");

    expect(cacheFriendships).toHaveBeenCalledWith("a", expect.any(Array), expect.any(String));
    expect(cacheFriendRequests).toHaveBeenCalled();
    expect(cacheGroups).toHaveBeenCalled();
    expect(cacheSharedExpenses).toHaveBeenCalledWith("a", [], expect.any(String));
    expect(cacheSettlements).toHaveBeenCalledWith("a", [], expect.any(String));
    expect(getPublicProfiles).toHaveBeenCalledWith(["a", "b"]);
    expect(cachePublicProfiles).toHaveBeenCalled();
    expect(cacheGroupExpenses).toHaveBeenCalledWith("a", "a__g", [], expect.any(String));
    expect(cacheGroupSettlements).toHaveBeenCalledWith("a", "a__g", [], expect.any(String));
  });

  it("reports a rejected group read", async () => {
    getGroupExpenses.mockRejectedValueOnce(new Error("boom"));

    await expect(pullSocialData("a")).rejects.toThrow("boom");
  });

  it("skips the profile lookup and the group loop when there is nothing", async () => {
    getFriendships.mockResolvedValueOnce([]);
    getGroups.mockResolvedValueOnce([]);

    await pullSocialData("a");

    expect(getPublicProfiles).not.toHaveBeenCalled();
    expect(cacheGroupExpenses).not.toHaveBeenCalled();
    expect(cacheGroupSettlements).not.toHaveBeenCalled();
  });
});
