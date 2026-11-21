import { describe, expect, it } from "@jest/globals";

import { createGroupsHarness } from "./groups-service.harness";

describe("GroupsService.getJoinRequests", () => {
  it("returns the owner queue oldest first with requester profiles", async () => {
    const { repository, friends, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });
    repository.seedJoinRequest({
      groupId: group.id,
      requesterId: "user-c",
      createdAt: "2026-11-21T10:00:00.000Z",
    });
    repository.seedJoinRequest({
      groupId: group.id,
      requesterId: "user-d",
      createdAt: "2026-11-20T10:00:00.000Z",
    });
    friends.seedProfile("user-d", "Dani", "user-d@example.com");

    const items = await service.getJoinRequests("user-a", group.id);

    expect(items.map((item) => item.request.requesterId)).toEqual([
      "user-d",
      "user-c",
    ]);
    expect(items[0].requester).toMatchObject({ uid: "user-d", displayName: "Dani" });
  });

  it("rejects a member who is not the owner", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });

    await expect(
      service.getJoinRequests("user-b", group.id),
    ).rejects.toMatchObject({ code: "NOT_GROUP_OWNER" });
  });
});

describe("GroupsService.getGroupDetail join requests", () => {
  it("includes the owner queue and hides it from other members", async () => {
    const { repository, friends, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });
    repository.seedJoinRequest({ groupId: group.id, requesterId: "user-c" });
    repository.seedJoinRequest({
      groupId: group.id,
      requesterId: "user-d",
      status: "accepted",
    });
    // Already joined through an invitation: the row can only fail ALREADY_MEMBER.
    repository.seedJoinRequest({ groupId: group.id, requesterId: "user-b" });
    friends.seedProfile("user-c", "Caro", "user-c@example.com");

    const ownerDetail = await service.getGroupDetail("user-a", group.id);
    const memberDetail = await service.getGroupDetail("user-b", group.id);

    expect(ownerDetail.joinRequests).toHaveLength(1);
    expect(ownerDetail.joinRequests[0].requester).toMatchObject({
      uid: "user-c",
    });
    expect(memberDetail.joinRequests).toEqual([]);
  });
});

describe("GroupsService.respondToJoinRequest", () => {
  it("accepts a request, adds the member and notifies the requester", async () => {
    const { repository, notifications, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a"] });
    const request = repository.seedJoinRequest({
      groupId: group.id,
      requesterId: "user-b",
    });

    const result = await service.respondToJoinRequest(
      "user-a",
      group.id,
      request.id,
      "accepted",
    );

    expect(result.group.memberIds).toEqual(["user-a", "user-b"]);
    expect(result.request.status).toBe("accepted");
    expect(notifications.joinOutcomes).toEqual([
      expect.objectContaining({
        requestId: request.id,
        groupId: group.id,
        groupName: "Viaje",
        requesterId: "user-b",
        ownerId: "user-a",
        decision: "accepted",
      }),
    ]);
  });

  it("rejects a request without adding the member", async () => {
    const { repository, notifications, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a"] });
    const request = repository.seedJoinRequest({
      groupId: group.id,
      requesterId: "user-b",
    });

    const result = await service.respondToJoinRequest(
      "user-a",
      group.id,
      request.id,
      "rejected",
    );

    expect(result.group.memberIds).toEqual(["user-a"]);
    expect(result.request.status).toBe("rejected");
    expect(notifications.joinOutcomes[0].decision).toBe("rejected");
  });

  it("is owner-only and rejects a request of another group", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });
    const other = repository.seedGroup({ id: "user-a__group-9" });
    const request = repository.seedJoinRequest({ groupId: other.id });

    await expect(
      service.respondToJoinRequest("user-b", group.id, request.id, "accepted"),
    ).rejects.toMatchObject({ code: "NOT_GROUP_OWNER" });

    await expect(
      service.respondToJoinRequest("user-a", group.id, request.id, "accepted"),
    ).rejects.toMatchObject({ code: "JOIN_REQUEST_NOT_FOUND" });
  });

  it("keeps the decision when the notification cannot be written", async () => {
    const { repository, notifications, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a"] });
    const request = repository.seedJoinRequest({
      groupId: group.id,
      requesterId: "user-b",
    });
    notifications.failure = new Error("notifications unavailable");

    await expect(
      service.respondToJoinRequest("user-a", group.id, request.id, "accepted"),
    ).resolves.toMatchObject({ request: { status: "accepted" } });
  });
});
