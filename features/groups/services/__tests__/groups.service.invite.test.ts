import { describe, expect, it } from "@jest/globals";

import { createGroupsHarness, seedFriend } from "./groups-service.harness";

describe("GroupsService.inviteMembers", () => {
  it("invites a friend that is not a member and not a pending one", async () => {
    const { repository, friends, notifications, service } =
      createGroupsHarness();
    const group = repository.seedGroup();
    seedFriend(friends, "user-c");

    const invitations = await service.inviteMembers("user-a", group.id, [
      "user-c",
    ]);

    expect(repository.inviteInputs[0]).toMatchObject({
      groupId: group.id,
      groupName: group.name,
      inviterId: "user-a",
      inviteeIds: ["user-c"],
    });
    expect(invitations).toHaveLength(1);
    // The pending invitations are actionable cards, not notifications.
    expect(notifications.joinOutcomes).toEqual([]);
  });

  it("skips current members without writing", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({
      memberIds: ["user-a", "user-b"],
    });

    await expect(
      service.inviteMembers("user-a", group.id, ["user-b"]),
    ).resolves.toEqual([]);
    expect(repository.inviteInputs).toEqual([]);
  });

  it("skips a friend that already has a pending invitation", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });
    repository.seedInvitation({ groupId: group.id, inviteeId: "user-c" });

    await expect(
      service.inviteMembers("user-a", group.id, ["user-b", "user-c"]),
    ).resolves.toEqual([]);
    expect(repository.inviteInputs).toEqual([]);
  });

  it("counts pending invitations as reserved seats", async () => {
    const { repository, friends, service } = createGroupsHarness();
    const members = ["user-a", ...Array.from({ length: 9 }, (_, i) => `m-${i}`)];
    const group = repository.seedGroup({ memberIds: members });

    for (let index = 0; index < 9; index += 1) {
      repository.seedInvitation({
        groupId: group.id,
        inviteeId: `pending-${index}`,
      });
    }
    seedFriend(friends, "user-x");
    seedFriend(friends, "user-y");

    // 10 members + 9 pending = 19 reserved, so only one seat is left.
    await expect(
      service.inviteMembers("user-a", group.id, ["user-x", "user-y"]),
    ).rejects.toMatchObject({ code: "GROUP_FULL" });

    await expect(
      service.inviteMembers("user-a", group.id, ["user-x"]),
    ).resolves.toHaveLength(1);
    expect(repository.inviteInputs[0].inviteeIds).toEqual(["user-x"]);
  });

  it("rejects a non-owner, a full group and a non-friend", async () => {
    const { repository, friends, service } = createGroupsHarness();
    const group = repository.seedGroup();
    seedFriend(friends, "user-c");

    await expect(
      service.inviteMembers("user-b", group.id, ["user-c"]),
    ).rejects.toMatchObject({ code: "NOT_GROUP_OWNER" });

    const full = repository.seedGroup({
      id: "user-a__group-full",
      memberIds: ["user-a", ...Array.from({ length: 19 }, (_, i) => `user-${i}`)],
    });
    await expect(
      service.inviteMembers("user-a", full.id, ["user-c"]),
    ).rejects.toMatchObject({ code: "GROUP_FULL" });

    await expect(
      service.inviteMembers("user-a", group.id, ["user-z"]),
    ).rejects.toMatchObject({ code: "NOT_FRIEND" });
    expect(repository.inviteInputs).toEqual([]);
  });

  it("validates the invitee list and the group existence", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup();

    await expect(
      service.inviteMembers("user-a", group.id, []),
    ).rejects.toMatchObject({ fieldErrors: { inviteeIds: "INVITEES_REQUIRED" } });

    await expect(
      service.inviteMembers("user-a", group.id, ["user-a"]),
    ).rejects.toMatchObject({ fieldErrors: { inviteeIds: "INVITEE_INVALID" } });

    await expect(
      service.inviteMembers("user-a", "missing", ["user-b"]),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
  });
});
