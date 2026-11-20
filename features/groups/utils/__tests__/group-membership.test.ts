import { describe, expect, it } from "@jest/globals";

import type { Friendship } from "@/features/friends/types/friend.types";

import {
  appendGroupMember,
  getFriendUids,
  isEligibleGroupInvitee,
  isGroupFull,
  isGroupMember,
  normalizeGroupInviteeIds,
  normalizeGroupMemberIds,
  prepareGroupMemberIds,
  removeGroupMember,
} from "../group-membership";

function friendship(...memberIds: string[]): Friendship {
  return {
    id: memberIds.join("__"),
    memberIds,
    requesterId: memberIds[0],
    recipientId: memberIds[1] ?? "",
    createdAt: "2026-11-20T10:00:00.000Z",
  };
}

describe("group membership", () => {
  it("starts the group with the owner only", () => {
    expect(prepareGroupMemberIds(" user-a ")).toEqual(["user-a"]);
    expect(prepareGroupMemberIds("")).toEqual([]);
  });

  it("normalizes order, duplicates and blanks with the owner first", () => {
    expect(
      normalizeGroupMemberIds("user-a", [
        "user-b",
        "user-a",
        " user-b ",
        "",
        "user-c",
      ]),
    ).toEqual(["user-a", "user-b", "user-c"]);
  });

  it("appends a member after the owner and ignores a blank id", () => {
    expect(appendGroupMember(["user-a", "user-b"], "user-c")).toEqual([
      "user-a",
      "user-b",
      "user-c",
    ]);
    expect(appendGroupMember(["user-a"], "  ")).toEqual(["user-a"]);
  });

  it("removes exactly one uid", () => {
    expect(removeGroupMember(["user-a", "user-b", "user-c"], "user-b")).toEqual([
      "user-a",
      "user-c",
    ]);
    expect(removeGroupMember(["user-a"], "user-z")).toEqual(["user-a"]);
  });

  it("bounds the group to 20 members, owner included", () => {
    const twenty = Array.from({ length: 20 }, (_, index) => `user-${index}`);

    expect(isGroupFull(twenty)).toBe(true);
    expect(isGroupFull(twenty.slice(0, 19))).toBe(false);
    expect(isGroupMember(twenty, " user-3 ")).toBe(true);
    expect(isGroupMember(twenty, "user-x")).toBe(false);
  });

  it("derives the accepted friends from the pair documents", () => {
    const friendships = [
      friendship("user-a", "user-b"),
      friendship("user-a", "user-c"),
      friendship("user-c", "user-d"),
    ];

    expect(getFriendUids(friendships, "user-a")).toEqual(["user-b", "user-c"]);
    expect(getFriendUids(friendships, "")).toEqual([]);
  });

  it("only allows a friend who is neither a member nor pending", () => {
    const base = {
      viewerUid: "user-a",
      memberIds: ["user-a", "user-b"],
      pendingIds: ["user-c"],
      friendUids: ["user-b", "user-c", "user-d"],
    };

    expect(isEligibleGroupInvitee("user-d", base)).toBe(true);
    expect(isEligibleGroupInvitee("user-b", base)).toBe(false);
    expect(isEligibleGroupInvitee("user-c", base)).toBe(false);
    expect(isEligibleGroupInvitee("user-z", base)).toBe(false);
    expect(isEligibleGroupInvitee("user-a", base)).toBe(false);
    expect(isEligibleGroupInvitee(" ", base)).toBe(false);
  });

  it("normalizes the invitee list without duplicates", () => {
    expect(
      normalizeGroupInviteeIds([" user-b ", "user-b", "user-c", ""]),
    ).toEqual(["user-b", "user-c"]);
  });
});
