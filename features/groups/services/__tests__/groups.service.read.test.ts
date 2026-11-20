import { describe, expect, it } from "@jest/globals";

import { createGroupsHarness, seedFriend } from "./groups-service.harness";

describe("GroupsService.getGroups", () => {
  it("sorts the member groups by name and then id", async () => {
    const { repository, service } = createGroupsHarness();
    repository.seedGroup({ id: "b", name: "Viaje" });
    repository.seedGroup({ id: "a", name: "Casa" });
    repository.seedGroup({ id: "z", name: "Otro", memberIds: ["user-z"] });

    const groups = await service.getGroups(" user-a ");

    expect(groups.map((group) => group.id)).toEqual(["a", "b"]);
  });

  it("requires a signed-in viewer", async () => {
    const { service } = createGroupsHarness();

    await expect(service.getGroups("")).rejects.toMatchObject({
      code: "SIGN_IN_REQUIRED",
    });
  });
});

describe("GroupsService.getGroup", () => {
  it("returns a group for its member and null when it is gone", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup();

    await expect(service.getGroup("user-a", group.id)).resolves.toMatchObject({
      id: group.id,
    });
    await expect(service.getGroup("user-a", "missing")).resolves.toBeNull();
    await expect(service.getGroup("user-a", "  ")).resolves.toBeNull();
  });

  it("maps a denied read to the safe missing state", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup();
    repository.denied.push(group.id);

    await expect(service.getGroup("user-b", group.id)).resolves.toBeNull();
  });

  it("rejects a readable group the caller does not belong to", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup();

    await expect(service.getGroup("user-z", group.id)).rejects.toMatchObject({
      code: "NOT_GROUP_MEMBER",
    });
  });
});

describe("GroupsService.getGroupDetail", () => {
  it("resolves the members, their roles and the pending invitations", async () => {
    const { repository, friends, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });
    repository.seedInvitation({ groupId: group.id, inviteeId: "user-c" });
    seedFriend(friends, "user-b", "Bea");
    friends.seedProfile("user-a", "Ana", "user-a@example.com");
    friends.seedProfile("user-c", "Caro", "user-c@example.com");

    const detail = await service.getGroupDetail("user-a", group.id);

    expect(detail.members).toEqual([
      { uid: "user-a", displayName: "Ana", email: "user-a@example.com", role: "owner" },
      { uid: "user-b", displayName: "Bea", email: "user-b@example.com", role: "member" },
    ]);
    expect(detail.invitations).toHaveLength(1);
    expect(detail.invitations[0].invitee).toMatchObject({ uid: "user-c" });
    expect(friends.profileBatchCalls).toContainEqual(["user-c"]);
  });

  it("hides the invitations from a member who is not the owner", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });

    const detail = await service.getGroupDetail("user-b", group.id);

    expect(detail.invitations).toEqual([]);
  });

  it("fails with GROUP_NOT_FOUND for a missing or denied group", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup();
    repository.denied.push(group.id);

    await expect(
      service.getGroupDetail("user-a", "missing"),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
    await expect(
      service.getGroupDetail("user-a", group.id),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
  });

  it("rejects a non-member of a readable group", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup();

    await expect(
      service.getGroupDetail("user-z", group.id),
    ).rejects.toMatchObject({ code: "NOT_GROUP_MEMBER" });
  });
});

describe("GroupsService invitations reads", () => {
  it("resolves the received invitations with the inviter profile", async () => {
    const { repository, friends, service } = createGroupsHarness();
    const group = repository.seedGroup();
    repository.seedInvitation({
      groupId: group.id,
      createdAt: "2026-11-19T10:00:00.000Z",
    });
    const second = repository.seedGroup({ id: "user-a__group-2" });
    repository.seedInvitation({
      groupId: second.id,
      inviteeId: "user-b",
      createdAt: "2026-11-20T10:00:00.000Z",
    });
    friends.seedProfile("user-a", "Ana", "user-a@example.com");

    const items = await service.getPendingInvitations("user-b");

    expect(items.map((item) => item.groupId)).toEqual([
      "user-a__group-2",
      group.id,
    ]);
    expect(items[0].inviter).toMatchObject({ uid: "user-a", displayName: "Ana" });
  });

  it("returns no rows when nothing was received", async () => {
    const { service } = createGroupsHarness();

    await expect(service.getPendingInvitations("user-b")).resolves.toEqual([]);
  });

  it("lists the owner pending invitations of one group", async () => {
    const { repository, friends, service } = createGroupsHarness();
    const group = repository.seedGroup();
    repository.seedInvitation({ groupId: group.id });
    repository.seedInvitation({ groupId: group.id, inviteeId: "user-c" });
    friends.seedProfile("user-c", "Caro", "user-c@example.com");

    const items = await service.getGroupInvitations("user-a", group.id);

    expect(items).toHaveLength(2);
    expect(items.some((item) => item.invitee?.uid === "user-c")).toBe(true);
  });

  it("rejects the invitations list for a non-owner", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });

    await expect(
      service.getGroupInvitations("user-b", group.id),
    ).rejects.toMatchObject({ code: "NOT_GROUP_OWNER" });
  });
});
