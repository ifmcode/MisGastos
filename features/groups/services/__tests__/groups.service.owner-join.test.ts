import { describe, expect, it } from "@jest/globals";

import { createGroupsHarness } from "./groups-service.harness";

describe("GroupsService.getOwnerJoinRequests", () => {
  it("aggregates the owned groups oldest first with requester profiles", async () => {
    const { repository, friends, service } = createGroupsHarness();
    const travel = repository.seedGroup({
      name: "Viaje",
      memberIds: ["user-a"],
    });
    const flat = repository.seedGroup({ name: "Piso", memberIds: ["user-a"] });
    // Owned by someone else: the viewer is only a member and has no queue.
    const foreign = repository.seedGroup({
      ownerId: "user-z",
      memberIds: ["user-z", "user-a"],
    });
    repository.seedJoinRequest({
      groupId: travel.id,
      requesterId: "user-b",
      createdAt: "2026-11-21T10:00:00.000Z",
    });
    repository.seedJoinRequest({
      groupId: flat.id,
      requesterId: "user-c",
      createdAt: "2026-11-20T10:00:00.000Z",
    });
    repository.seedJoinRequest({
      groupId: flat.id,
      requesterId: "user-d",
      createdAt: "2026-11-21T10:00:00.000Z",
    });
    repository.seedJoinRequest({
      groupId: foreign.id,
      requesterId: "user-e",
      createdAt: "2026-11-19T10:00:00.000Z",
    });
    friends.seedProfile("user-d", "Dani", "user-d@example.com");

    const rows = await service.getOwnerJoinRequests("user-a");

    expect(rows.map((row) => row.groupId)).toEqual([
      flat.id,
      travel.id,
      flat.id,
    ]);
    expect(rows.map((row) => row.groupName)).toEqual([
      "Piso",
      "Viaje",
      "Piso",
    ]);
    expect(rows.map((row) => row.item.request.requesterId)).toEqual([
      "user-c",
      "user-b",
      "user-d",
    ]);
    expect(rows[0].item.requester).toBeNull();
    expect(rows[2].item.requester).toMatchObject({
      uid: "user-d",
      displayName: "Dani",
    });
  });

  it("returns an empty queue for a viewer who owns no group", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({
      ownerId: "user-z",
      memberIds: ["user-z", "user-a"],
    });
    repository.seedJoinRequest({ groupId: group.id, requesterId: "user-b" });

    await expect(service.getOwnerJoinRequests("user-a")).resolves.toEqual([]);
  });

  it("returns an empty queue when the owned groups have no requests", async () => {
    const { repository, service } = createGroupsHarness();
    repository.seedGroup({ memberIds: ["user-a"] });

    await expect(service.getOwnerJoinRequests("user-a")).resolves.toEqual([]);
  });

  it("keeps only pending requests from non-members", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({
      name: "Viaje",
      memberIds: ["user-a", "user-b"],
    });
    repository.seedJoinRequest({ groupId: group.id, requesterId: "user-c" });
    repository.seedJoinRequest({
      groupId: group.id,
      requesterId: "user-d",
      status: "accepted",
    });
    repository.seedJoinRequest({
      groupId: group.id,
      requesterId: "user-e",
      status: "rejected",
    });
    // Already joined through an invitation: the row can only fail ALREADY_MEMBER.
    repository.seedJoinRequest({ groupId: group.id, requesterId: "user-b" });

    const rows = await service.getOwnerJoinRequests("user-a");

    expect(rows).toHaveLength(1);
    expect(rows[0].item.request.requesterId).toBe("user-c");
    expect(rows[0].groupName).toBe("Viaje");
  });

  it("requires a signed-in viewer", async () => {
    const { service } = createGroupsHarness();

    await expect(service.getOwnerJoinRequests("   ")).rejects.toMatchObject({
      code: "SIGN_IN_REQUIRED",
    });
  });
});

describe("GroupsService.getGroupDetail join queue", () => {
  it("no longer carries the owner queue on the detail", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });
    repository.seedJoinRequest({ groupId: group.id, requesterId: "user-c" });

    const detail = await service.getGroupDetail("user-a", group.id);

    expect(detail).not.toHaveProperty("joinRequests");
    expect(Object.keys(detail).sort()).toEqual([
      "group",
      "invitations",
      "members",
    ]);
  });
});
