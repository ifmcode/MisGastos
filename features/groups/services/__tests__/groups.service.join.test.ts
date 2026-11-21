import { describe, expect, it, jest } from "@jest/globals";

import { createGroupsHarness } from "./groups-service.harness";

describe("GroupsService.lookupJoinCode", () => {
  it("normalizes the code and resolves membership plus request status", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a", "user-b"] });
    const request = repository.seedJoinRequest({
      groupId: group.id,
      requesterId: "user-b",
    });
    repository.seedCode(group, "WXYZ2345");

    const lookup = await service.lookupJoinCode("user-b", " wxyz-2345 ");

    expect(lookup).toEqual({
      code: "WXYZ2345",
      groupId: group.id,
      ownerId: "user-a",
      groupName: "Viaje",
      membership: "member",
      requestStatus: request.status,
    });
  });

  it("reports no membership and no request for a newcomer", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup();
    repository.seedCode(group);

    await expect(service.lookupJoinCode("user-z", "ABCD2345")).resolves.toEqual(
      {
        code: "ABCD2345",
        groupId: group.id,
        ownerId: "user-a",
        groupName: "Viaje",
        membership: "none",
        requestStatus: null,
      },
    );
  });

  it("rejects a malformed or unknown code without reading the group", async () => {
    const { service } = createGroupsHarness();

    await expect(
      service.lookupJoinCode("user-z", "ABCD2340"),
    ).rejects.toMatchObject({ code: "INVALID_JOIN_CODE" });
    await expect(
      service.lookupJoinCode("user-z", "ABCD2345"),
    ).rejects.toMatchObject({ code: "INVALID_JOIN_CODE" });
  });
});

describe("GroupsService.requestToJoin", () => {
  it("creates the pending request and notifies the owner", async () => {
    const { repository, notifications, service } = createGroupsHarness();
    const group = repository.seedGroup();
    repository.seedCode(group);

    const request = await service.requestToJoin("user-b", "abcd2345");

    expect(request).toMatchObject({
      groupId: group.id,
      requesterId: "user-b",
      joinCode: "ABCD2345",
      status: "pending",
    });
    expect(repository.joinRequestInputs[0]).toMatchObject({
      groupId: group.id,
      requesterId: "user-b",
      joinCode: "ABCD2345",
    });
    expect(notifications.joinRequests).toEqual([
      expect.objectContaining({
        requestId: request.id,
        groupId: group.id,
        groupName: "Viaje",
        requesterId: "user-b",
        ownerId: "user-a",
      }),
    ]);
  });

  it("rejects a member, a pending request and a resolved one", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({ memberIds: ["user-a"] });
    repository.seedCode(group);

    await expect(
      service.requestToJoin("user-a", "ABCD2345"),
    ).rejects.toMatchObject({ code: "ALREADY_MEMBER" });

    repository.seedJoinRequest({
      groupId: group.id,
      requesterId: "user-b",
      status: "pending",
    });
    await expect(
      service.requestToJoin("user-b", "ABCD2345"),
    ).rejects.toMatchObject({ code: "JOIN_REQUEST_ALREADY_PENDING" });

    repository.seedJoinRequest({
      groupId: group.id,
      requesterId: "user-c",
      status: "rejected",
    });
    await expect(
      service.requestToJoin("user-c", "ABCD2345"),
    ).rejects.toMatchObject({ code: "JOIN_REQUEST_RESOLVED" });

    expect(repository.joinRequestInputs).toEqual([]);
  });

  it("keeps the request when the notification cannot be written", async () => {
    const { repository, notifications, service } = createGroupsHarness();
    const group = repository.seedGroup();
    repository.seedCode(group);
    notifications.failure = new Error("notifications unavailable");

    await expect(service.requestToJoin("user-b", "ABCD2345")).resolves.toMatchObject(
      { status: "pending" },
    );
  });
});

describe("GroupsService.ensureJoinCode", () => {
  it("returns an existing code without writing", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup();

    await expect(service.ensureJoinCode("user-a", group.id)).resolves.toBe(
      "ABCD2345",
    );
    expect(repository.ensureInputs).toEqual([]);
  });

  it("backfills a legacy group lazily", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({ joinCode: null });

    const code = await service.ensureJoinCode("user-a", group.id);

    expect(code).toMatch(/^[2-9A-HJ-NP-Z]{8}$/);
    expect(repository.groups.get(group.id)?.joinCode).toBe(code);
    expect(repository.ensureInputs).toHaveLength(1);
  });

  it("reuses the code a concurrent client stored after a denied write", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({ joinCode: null });
    const denied = Object.assign(new Error("denied"), {
      code: "permission-denied",
    });
    jest
      .spyOn(repository, "ensureGroupJoinCode")
      .mockImplementationOnce(async () => {
        repository.groups.set(group.id, { ...group, joinCode: "WXYZ2345" });
        throw denied;
      });

    await expect(service.ensureJoinCode("user-a", group.id)).resolves.toBe(
      "WXYZ2345",
    );
  });

  it("fails with JOIN_CODE_NOT_AVAILABLE when every reload has no code", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({ joinCode: null });
    jest
      .spyOn(repository, "ensureGroupJoinCode")
      .mockRejectedValue(
        Object.assign(new Error("denied"), { code: "permission-denied" }),
      );

    await expect(service.ensureJoinCode("user-a", group.id)).rejects.toMatchObject(
      { code: "JOIN_CODE_NOT_AVAILABLE" },
    );
  });

  it("retries a denied backfill with a fresh code", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({ joinCode: null });
    const denied = Object.assign(new Error("denied"), {
      code: "permission-denied",
    });
    const ensure = jest
      .spyOn(repository, "ensureGroupJoinCode")
      .mockRejectedValueOnce(denied)
      .mockRejectedValueOnce(denied);

    const code = await service.ensureJoinCode("user-a", group.id);

    expect(code).toMatch(/^[2-9A-HJ-NP-Z]{8}$/);
    expect(ensure).toHaveBeenCalledTimes(3);
    expect(repository.groups.get(group.id)?.joinCode).toBe(code);
  });

  it("rejects a non-owner", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({
      memberIds: ["user-a", "user-b"],
      joinCode: null,
    });

    await expect(
      service.ensureJoinCode("user-b", group.id),
    ).rejects.toMatchObject({ code: "NOT_GROUP_OWNER" });
  });
});
