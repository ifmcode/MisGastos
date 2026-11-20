import { describe, expect, it } from "@jest/globals";

import type { Friend } from "@/features/friends/types/friend.types";

import type { GroupInvitationItem } from "../../types/group.types";
import {
  getGroupInviteCapacity,
  getGroupInviteePool,
} from "../group-invite-eligibility";

function buildFriend(uid: string): Friend {
  return {
    uid,
    displayName: uid,
    email: `${uid}@example.com`,
    balances: [],
    since: "2026-01-01T00:00:00.000Z",
  };
}

function buildInvitation(inviteeId: string): GroupInvitationItem {
  return {
    invitation: {
      id: `group__${inviteeId}`,
      groupId: "group",
      groupName: "Group",
      inviterId: "me",
      inviteeId,
      pairId: "me__invitee",
      status: "pending",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    invitee: null,
  };
}

describe("getGroupInviteePool", () => {
  it("keeps accepted friends outside the group without a pending invitation", () => {
    const friends = [
      buildFriend("me"),
      buildFriend("member"),
      buildFriend("pending"),
      buildFriend("free"),
    ];

    const pool = getGroupInviteePool(friends, {
      viewerUid: "me",
      memberIds: ["me", "member"],
      invitations: [buildInvitation("pending")],
    });

    expect(pool.map((friend) => friend.uid)).toEqual(["free"]);
  });

  it("returns an empty pool when every friend is already involved", () => {
    const friends = [buildFriend("member")];

    const pool = getGroupInviteePool(friends, {
      viewerUid: "me",
      memberIds: ["me", "member"],
      invitations: [],
    });

    expect(pool).toEqual([]);
  });
});

describe("getGroupInviteCapacity", () => {
  it("reserves one seat for the owner", () => {
    expect(getGroupInviteCapacity(["me"])).toBe(19);
    expect(getGroupInviteCapacity(["me", "friend"])).toBe(18);
  });

  it("reserves a seat for every pending invitation", () => {
    expect(getGroupInviteCapacity(["me", "friend"], 3)).toBe(15);
    expect(getGroupInviteCapacity(["me", "friend"], 18)).toBe(0);
    expect(getGroupInviteCapacity(["me", "friend"], 25)).toBe(0);
  });

  it("never reports a negative capacity", () => {
    const full = Array.from({ length: 20 }, (_, index) => `uid-${index}`);

    expect(getGroupInviteCapacity(full)).toBe(0);
    expect(getGroupInviteCapacity([...full, "extra"])).toBe(0);
  });
});
