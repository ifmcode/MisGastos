import { describe, expect, it } from "@jest/globals";

import type { Group, GroupInvitation } from "../../types/group.types";
import {
  compareGroups,
  countPendingInvitations,
  filterPendingInvitations,
  getGroupMemberCount,
  getGroupPendingInvitations,
  sortGroups,
  sortInvitationsNewestFirst,
} from "../group-list";

function group(overrides: Partial<Group> = {}): Group {
  return {
    id: "group-1",
    ownerId: "user-a",
    memberIds: ["user-a", "user-b"],
    name: "Viaje",
    description: null,
    defaultCurrency: "EUR",
    createdAt: "2026-11-20T10:00:00.000Z",
    updatedAt: "2026-11-20T10:00:00.000Z",
    ...overrides,
  };
}

function invitation(overrides: Partial<GroupInvitation> = {}): GroupInvitation {
  return {
    id: "group-1__user-b",
    groupId: "group-1",
    groupName: "Viaje",
    inviterId: "user-a",
    inviteeId: "user-b",
    pairId: "user-a__user-b",
    status: "pending",
    createdAt: "2026-11-20T10:00:00.000Z",
    updatedAt: "2026-11-20T10:00:00.000Z",
    ...overrides,
  };
}

describe("group list ordering", () => {
  it("sorts by name ascending and breaks ties by id", () => {
    const groups = [
      group({ id: "c", name: "Viaje" }),
      group({ id: "b", name: "Casa" }),
      group({ id: "a", name: "Viaje" }),
    ];

    expect(sortGroups(groups).map((item) => item.id)).toEqual(["b", "a", "c"]);
    expect(compareGroups(groups[0], groups[0])).toBe(0);
    expect(compareGroups(groups[1], groups[0])).toBe(-1);
    expect(compareGroups(groups[0], groups[1])).toBe(1);
  });

  it("counts the owner in the member count", () => {
    expect(getGroupMemberCount(group())).toBe(2);
  });
});

describe("group invitation ordering", () => {
  it("keeps pending rows and sorts them newest first", () => {
    const invitations = [
      invitation({ id: "old", createdAt: "2026-11-18T10:00:00.000Z" }),
      invitation({ id: "new", createdAt: "2026-11-20T10:00:00.000Z" }),
      invitation({ id: "rejected", status: "rejected" }),
    ];

    expect(
      sortInvitationsNewestFirst(filterPendingInvitations(invitations)).map(
        (item) => item.id,
      ),
    ).toEqual(["new", "old"]);
    expect(countPendingInvitations(invitations)).toBe(2);
  });

  it("filters one group and breaks createdAt ties by id", () => {
    const invitations = [
      invitation({ id: "same-b" }),
      invitation({ id: "same-a" }),
      invitation({ id: "other", groupId: "group-2" }),
    ];

    expect(
      getGroupPendingInvitations(invitations, " group-1 ").map(
        (item) => item.id,
      ),
    ).toEqual(["same-a", "same-b"]);
  });
});
