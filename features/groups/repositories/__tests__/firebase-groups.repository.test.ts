import { describe, expect, it, jest } from "@jest/globals";

const mockGetGroups = jest.fn(async (..._args: unknown[]) => ["group"]);
const mockGetGroup = jest.fn(async (..._args: unknown[]) => "group");
const mockGetGroupInvitation = jest.fn(async (..._args: unknown[]) => "invite");
const mockGetGroupInvitations = jest.fn(async (..._args: unknown[]) => [
  "invite",
]);
const mockGetPendingInvitations = jest.fn(async (..._args: unknown[]) => [
  "invite",
]);

jest.mock("../groups.operations", () => ({
  getGroupsOperation: (...args: unknown[]) => mockGetGroups(...args),
  getGroupOperation: (...args: unknown[]) => mockGetGroup(...args),
  getGroupInvitationOperation: (...args: unknown[]) =>
    mockGetGroupInvitation(...args),
  getGroupInvitationsOperation: (...args: unknown[]) =>
    mockGetGroupInvitations(...args),
  getPendingInvitationsOperation: (...args: unknown[]) =>
    mockGetPendingInvitations(...args),
}));

const mockCreate = jest.fn(async (..._args: unknown[]) => "created");
const mockUpdate = jest.fn(async (..._args: unknown[]) => "updated");
const mockRemove = jest.fn(async (..._args: unknown[]) => "removed");

jest.mock("../group-create.operation", () => ({
  createGroupWithInvitationsOperation: (...args: unknown[]) =>
    mockCreate(...args),
}));

jest.mock("../group-update.operations", () => ({
  updateGroupOperation: (...args: unknown[]) => mockUpdate(...args),
}));

jest.mock("../group-member-remove.operation", () => ({
  removeGroupMemberOperation: (...args: unknown[]) => mockRemove(...args),
}));

const mockLeave = jest.fn(async (..._args: unknown[]) => "left");
const mockTransfer = jest.fn(async (..._args: unknown[]) => "transferred");

jest.mock("../group-member-leave.operation", () => ({
  leaveGroupOperation: (...args: unknown[]) => mockLeave(...args),
}));

jest.mock("../group-owner-transfer.operation", () => ({
  transferGroupOwnershipOperation: (...args: unknown[]) => mockTransfer(...args),
}));

const mockGetActivity = jest.fn(async (..._args: unknown[]) => ({
  items: ["activity"],
  hasMore: false,
}));

jest.mock("../group-activity.operations", () => ({
  getGroupActivityOperation: (...args: unknown[]) => mockGetActivity(...args),
}));

const mockInvite = jest.fn(async (..._args: unknown[]) => ["invite"]);
const mockStatus = jest.fn(async (..._args: unknown[]) => "invite");

jest.mock("../group-invitation.operations", () => ({
  inviteMembersOperation: (...args: unknown[]) => mockInvite(...args),
  updateGroupInvitationStatusOperation: (...args: unknown[]) =>
    mockStatus(...args),
}));

const mockAccept = jest.fn(async (..._args: unknown[]) => "group");

jest.mock("../group-accept.operation", () => ({
  acceptGroupInvitationOperation: (...args: unknown[]) => mockAccept(...args),
}));

const mockGetGroupCode = jest.fn(async (..._args: unknown[]) => "code");
const mockGetGroupJoinRequest = jest.fn(async (..._args: unknown[]) => "request");
const mockGetGroupJoinRequests = jest.fn(async (..._args: unknown[]) => [
  "request",
]);

jest.mock("../group-join-read.operations", () => ({
  getGroupCodeOperation: (...args: unknown[]) => mockGetGroupCode(...args),
  getGroupJoinRequestOperation: (...args: unknown[]) =>
    mockGetGroupJoinRequest(...args),
  getGroupJoinRequestsOperation: (...args: unknown[]) =>
    mockGetGroupJoinRequests(...args),
}));

const mockCreateJoinRequest = jest.fn(async (..._args: unknown[]) => "request");
const mockRespondJoinRequest = jest.fn(async (..._args: unknown[]) => "result");
const mockEnsureJoinCode = jest.fn(async (..._args: unknown[]) => "group");

jest.mock("../group-join.operations", () => ({
  createGroupJoinRequestOperation: (...args: unknown[]) =>
    mockCreateJoinRequest(...args),
  respondToGroupJoinRequestOperation: (...args: unknown[]) =>
    mockRespondJoinRequest(...args),
  ensureGroupJoinCodeOperation: (...args: unknown[]) =>
    mockEnsureJoinCode(...args),
}));

import { FirebaseGroupsRepository } from "../firebase-groups.repository";

const repository = new FirebaseGroupsRepository();

describe("FirebaseGroupsRepository delegation", () => {
  it("delegates every read to its operation", async () => {
    await expect(repository.getGroups("user-a")).resolves.toEqual(["group"]);
    await expect(repository.getGroup("group-1")).resolves.toBe("group");
    await expect(repository.getGroupInvitation("group-1__user-b")).resolves.toBe(
      "invite",
    );
    await expect(
      repository.getGroupInvitations("group-1"),
    ).resolves.toEqual(["invite"]);
    await expect(repository.getPendingInvitations("user-b")).resolves.toEqual([
      "invite",
    ]);
    await expect(repository.getGroupCode("ABCD2345")).resolves.toBe("code");
    await expect(repository.getGroupJoinRequest("group-1__user-b")).resolves.toBe(
      "request",
    );
    await expect(repository.getGroupJoinRequests("group-1")).resolves.toEqual([
      "request",
    ]);
    await expect(
      repository.getGroupActivity("group-1", { limit: 10 }),
    ).resolves.toEqual({ items: ["activity"], hasMore: false });

    expect(mockGetGroups).toHaveBeenCalledWith("user-a");
    expect(mockGetGroup).toHaveBeenCalledWith("group-1");
    expect(mockGetGroupInvitation).toHaveBeenCalledWith("group-1__user-b");
    expect(mockGetGroupInvitations).toHaveBeenCalledWith("group-1");
    expect(mockGetPendingInvitations).toHaveBeenCalledWith("user-b");
    expect(mockGetGroupCode).toHaveBeenCalledWith("ABCD2345");
    expect(mockGetGroupJoinRequest).toHaveBeenCalledWith("group-1__user-b");
    expect(mockGetGroupJoinRequests).toHaveBeenCalledWith("group-1");
    expect(mockGetActivity).toHaveBeenCalledWith("group-1", { limit: 10 });
  });

  it("delegates every write to its operation", async () => {
    const createInput = {
      ownerId: "user-a",
      name: "Viaje",
      description: null,
      defaultCurrency: "EUR" as const,
      inviteeIds: ["user-b"],
      createdAt: "2026-11-20T10:00:00.000Z",
    };
    const update = {
      name: "Viaje",
      description: null,
      defaultCurrency: "EUR" as const,
      simplifyDebts: true,
      updatedAt: "2026-11-20T10:00:00.000Z",
    };
    const inviteInput = {
      groupId: "group-1",
      groupName: "Viaje",
      inviterId: "user-a",
      inviteeIds: ["user-b"],
      updatedAt: "2026-11-20T10:00:00.000Z",
    };

    await expect(
      repository.createGroupWithInvitations(createInput),
    ).resolves.toBe("created");
    await expect(
      repository.updateGroup("user-a", "group-1", update),
    ).resolves.toBe("updated");
    await expect(
      repository.removeMember({
        groupId: "group-1",
        actorId: "user-a",
        memberId: "user-b",
        targetName: "Bea",
        updatedAt: "2026-11-20T10:00:00.000Z",
      }),
    ).resolves.toBe("removed");
    await expect(
      repository.leaveGroup({
        groupId: "group-1",
        memberId: "user-b",
        targetName: "Bea",
        updatedAt: "2026-11-20T10:00:00.000Z",
      }),
    ).resolves.toBe("left");
    await expect(
      repository.transferOwnership({
        groupId: "group-1",
        actorId: "user-a",
        newOwnerId: "user-b",
        updatedAt: "2026-11-20T10:00:00.000Z",
      }),
    ).resolves.toBe("transferred");
    await expect(repository.inviteMembers(inviteInput)).resolves.toEqual([
      "invite",
    ]);
    await expect(
      repository.acceptInvitation("user-b", "group-1__user-b"),
    ).resolves.toBe("group");
    await expect(
      repository.rejectInvitation("group-1__user-b", update.updatedAt),
    ).resolves.toBe("invite");
    await expect(
      repository.cancelInvitation("group-1__user-b", update.updatedAt),
    ).resolves.toBe("invite");
    await expect(
      repository.createGroupJoinRequest({
        groupId: "group-1",
        requesterId: "user-b",
        joinCode: "ABCD2345",
        createdAt: update.updatedAt,
      }),
    ).resolves.toBe("request");
    await expect(
      repository.respondToGroupJoinRequest({
        requestId: "group-1__user-b",
        groupId: "group-1",
        viewerUid: "user-a",
        decision: "accepted",
        updatedAt: update.updatedAt,
      }),
    ).resolves.toBe("result");
    await expect(
      repository.ensureGroupJoinCode({
        groupId: "group-1",
        code: "ABCD2345",
        updatedAt: update.updatedAt,
      }),
    ).resolves.toBe("group");

    expect(mockCreate).toHaveBeenCalledWith(createInput);
    expect(mockUpdate).toHaveBeenCalledWith("user-a", "group-1", update);
    expect(mockRemove).toHaveBeenCalledWith({
      groupId: "group-1",
      actorId: "user-a",
      memberId: "user-b",
      targetName: "Bea",
      updatedAt: "2026-11-20T10:00:00.000Z",
    });
    expect(mockLeave).toHaveBeenCalledWith(expect.objectContaining({ memberId: "user-b" }));
    expect(mockTransfer).toHaveBeenCalledWith(
      expect.objectContaining({ newOwnerId: "user-b" }),
    );
    expect(mockInvite).toHaveBeenCalledWith(inviteInput);
    expect(mockAccept).toHaveBeenCalledWith("user-b", "group-1__user-b");
    expect(mockStatus).toHaveBeenCalledWith(
      "group-1__user-b",
      "rejected",
      update.updatedAt,
    );
    expect(mockStatus).toHaveBeenCalledWith(
      "group-1__user-b",
      "cancelled",
      update.updatedAt,
    );
  });
});
