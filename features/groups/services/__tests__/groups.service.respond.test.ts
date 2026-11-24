import { describe, expect, it } from "@jest/globals";

import { createGroupsHarness, seedFriend } from "./groups-service.harness";

describe("GroupsService.acceptInvitation", () => {
  it("accepts a pending invitation for the invitee", async () => {
    const { repository, friends, service } = createGroupsHarness();
    const group = repository.seedGroup();
    const invitation = repository.seedInvitation({ groupId: group.id });
    seedFriend(friends, "user-b");

    const accepted = await service.acceptInvitation("user-b", invitation.id);

    expect(repository.accepted).toEqual([
      { viewerUid: "user-b", invitationId: invitation.id },
    ]);
    expect(accepted.memberIds).toEqual(["user-a", "user-b"]);
  });

  it("rejects a caller that is not the invitee", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup();
    const invitation = repository.seedInvitation({ groupId: group.id });

    await expect(
      service.acceptInvitation("user-a", invitation.id),
    ).rejects.toMatchObject({ code: "NOT_INVITEE" });
    expect(repository.accepted).toEqual([]);
  });

  it("requires a pending invitation", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup();
    const invitation = repository.seedInvitation({
      groupId: group.id,
      status: "rejected",
    });

    await expect(
      service.acceptInvitation("user-b", invitation.id),
    ).rejects.toMatchObject({ code: "INVITATION_NOT_PENDING" });
  });

  it("fails for a missing invitation", async () => {
    const { service } = createGroupsHarness();

    await expect(
      service.acceptInvitation("user-b", "user-a__group-1__user-b"),
    ).rejects.toMatchObject({ code: "INVITATION_NOT_FOUND" });
  });

  it("re-checks the friendship before accepting", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup();
    const invitation = repository.seedInvitation({ groupId: group.id });

    await expect(
      service.acceptInvitation("user-b", invitation.id),
    ).rejects.toMatchObject({ code: "NOT_FRIEND" });
    expect(repository.accepted).toEqual([]);
  });
});

describe("GroupsService invitation lifecycle after a transfer", () => {
  it("accepts a pending invitation whose inviter is the previous owner", async () => {
    const { repository, friends, service } = createGroupsHarness();
    const group = repository.seedGroup({
      id: "user-a__group-1",
      ownerId: "user-b",
      createdBy: "user-a",
      memberIds: ["user-b"],
    });
    const invitation = repository.seedInvitation({
      groupId: group.id,
      inviterId: "user-a",
      inviteeId: "user-c",
    });
    seedFriend(friends, "user-c");

    const accepted = await service.acceptInvitation("user-c", invitation.id);

    expect(repository.accepted).toEqual([
      { viewerUid: "user-c", invitationId: invitation.id },
    ]);
    expect(accepted.memberIds).toEqual(["user-b", "user-c"]);
  });

  it("lets the new owner cancel an invitation opened by the previous owner", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({
      id: "user-a__group-1",
      ownerId: "user-b",
      createdBy: "user-a",
      memberIds: ["user-b"],
    });
    const invitation = repository.seedInvitation({
      groupId: group.id,
      inviterId: "user-a",
      inviteeId: "user-c",
    });

    const cancelled = await service.cancelInvitation("user-b", invitation.id);

    expect(cancelled.status).toBe("cancelled");
    expect(repository.invitedCalls).toEqual([`cancelled:${invitation.id}`]);
  });

  it("no longer lets the previous owner cancel or read that invitation", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup({
      id: "user-a__group-1",
      ownerId: "user-b",
      createdBy: "user-a",
      memberIds: ["user-b"],
    });
    const invitation = repository.seedInvitation({
      groupId: group.id,
      inviterId: "user-a",
      inviteeId: "user-c",
    });

    await expect(
      service.cancelInvitation("user-a", invitation.id),
    ).rejects.toMatchObject({ code: "NOT_GROUP_OWNER" });
    await expect(
      service.getGroupInvitations("user-a", group.id),
    ).rejects.toMatchObject({ code: "NOT_GROUP_OWNER" });
  });
});

describe("GroupsService.rejectInvitation and cancelInvitation", () => {
  it("lets the invitee reject a pending invitation", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup();
    const invitation = repository.seedInvitation({ groupId: group.id });

    const rejected = await service.rejectInvitation("user-b", invitation.id);

    expect(rejected.status).toBe("rejected");
    expect(repository.invitedCalls).toEqual([`rejected:${invitation.id}`]);
  });

  it("lets the inviter cancel a pending invitation", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup();
    const invitation = repository.seedInvitation({ groupId: group.id });

    const cancelled = await service.cancelInvitation("user-a", invitation.id);

    expect(cancelled.status).toBe("cancelled");
    expect(repository.invitedCalls).toEqual([`cancelled:${invitation.id}`]);
  });

  it("rejects a non-invitee and a non-owner", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup();
    const invitation = repository.seedInvitation({ groupId: group.id });

    await expect(
      service.rejectInvitation("user-a", invitation.id),
    ).rejects.toMatchObject({ code: "NOT_INVITEE" });
    await expect(
      service.cancelInvitation("user-b", invitation.id),
    ).rejects.toMatchObject({ code: "NOT_GROUP_OWNER" });
  });

  it("does not re-answer a resolved invitation", async () => {
    const { repository, service } = createGroupsHarness();
    const group = repository.seedGroup();
    const invitation = repository.seedInvitation({
      groupId: group.id,
      status: "accepted",
    });

    await expect(
      service.rejectInvitation("user-b", invitation.id),
    ).rejects.toMatchObject({ code: "INVITATION_NOT_PENDING" });
    await expect(
      service.cancelInvitation("user-a", invitation.id),
    ).rejects.toMatchObject({ code: "INVITATION_NOT_PENDING" });
  });
});
