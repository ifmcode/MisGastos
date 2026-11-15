import { describe, expect, it } from "@jest/globals";

import {
  FRIEND_PAIR_SEPARATOR,
  createFriendPairId,
  getFriendPairMemberIds,
  getOtherMemberId,
  isValidFriendPair,
} from "../friend-pair";

describe("getFriendPairMemberIds", () => {
  it("sorts two uids lexicographically", () => {
    expect(getFriendPairMemberIds("user-b", "user-a")).toEqual([
      "user-a",
      "user-b",
    ]);
    expect(getFriendPairMemberIds("user-a", "user-b")).toEqual([
      "user-a",
      "user-b",
    ]);
  });

  it("trims the uids before sorting", () => {
    expect(getFriendPairMemberIds("  user-b ", " user-a")).toEqual([
      "user-a",
      "user-b",
    ]);
  });

  it("rejects empty and repeated uids", () => {
    expect(getFriendPairMemberIds("", "user-a")).toEqual([]);
    expect(getFriendPairMemberIds("user-a", "   ")).toEqual([]);
    expect(getFriendPairMemberIds("user-a", "user-a")).toEqual([]);
    expect(getFriendPairMemberIds(undefined, "user-a")).toEqual([]);
  });
});

describe("createFriendPairId", () => {
  it("joins the sorted pair with the separator", () => {
    expect(createFriendPairId("user-b", "user-a")).toBe(
      `user-a${FRIEND_PAIR_SEPARATOR}user-b`,
    );
  });

  it("returns an empty id for an invalid pair", () => {
    expect(createFriendPairId("user-a", "user-a")).toBe("");
    expect(createFriendPairId("", "user-b")).toBe("");
  });
});

describe("isValidFriendPair", () => {
  it("accepts only two distinct sorted uids", () => {
    expect(isValidFriendPair(["user-a", "user-b"])).toBe(true);
    expect(isValidFriendPair(["user-b", "user-a"])).toBe(false);
    expect(isValidFriendPair(["user-a", "user-a"])).toBe(false);
    expect(isValidFriendPair(["user-a"])).toBe(false);
    expect(isValidFriendPair(["user-a", "user-b", "user-c"])).toBe(false);
    expect(isValidFriendPair([1, 2])).toBe(false);
    expect(isValidFriendPair("user-a__user-b")).toBe(false);
    expect(isValidFriendPair(null)).toBe(false);
  });
});

describe("getOtherMemberId", () => {
  it("returns the member that is not the viewer", () => {
    expect(getOtherMemberId(["user-a", "user-b"], "user-a")).toBe("user-b");
    expect(getOtherMemberId(["user-a", "user-b"], "user-b")).toBe("user-a");
  });

  it("returns null when the viewer is not a member or the pair is invalid", () => {
    expect(getOtherMemberId(["user-a", "user-b"], "user-c")).toBeNull();
    expect(getOtherMemberId(["user-a"], "user-a")).toBeNull();
    expect(getOtherMemberId(["user-a", "user-b"], "  ")).toBeNull();
  });
});
