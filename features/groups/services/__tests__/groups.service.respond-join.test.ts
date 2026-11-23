import { describe, expect, it } from "@jest/globals";

import { createGroupsHarness } from "./groups-service.harness";

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
