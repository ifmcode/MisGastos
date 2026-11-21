import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the modules.
import {
  GROUP_DOCUMENT,
  GROUP_ID,
  INVITATION_DOCUMENT,
  documentSnapshot,
  missingSnapshot,
  mockBatchCommit,
  mockBatchSet,
  mockBatchUpdate,
  mockGetDoc,
  mockGetDocs,
  mockTransactionGet,
  mockTransactionUpdate,
  querySnapshot,
  setupGroupsRepositoryMocks,
} from "./groups-repository.test-helpers";
import { createGroupWithInvitationsOperation } from "../group-create.operation";
import {
  removeGroupMemberOperation,
  updateGroupOperation,
} from "../group-update.operations";
import { GroupOperationError } from "../../services/group.errors";

beforeEach(setupGroupsRepositoryMocks);

const CREATED_AT = "2026-11-20T10:00:00.000Z";

describe("createGroupWithInvitationsOperation", () => {
  it("writes the owner group plus every pending invitation in one batch", async () => {
    const result = await createGroupWithInvitationsOperation({
      ownerId: "user-a",
      name: "Viaje",
      description: null,
      defaultCurrency: "EUR",
      inviteeIds: ["user-b"],
      createdAt: CREATED_AT,
    });

    expect(mockBatchSet).toHaveBeenCalledTimes(3);
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);

    const groupData = mockBatchSet.mock.calls[0][1];
    expect(result.group.id.startsWith("user-a__")).toBe(true);
    expect(result.group.joinCode).toMatch(/^[2-9A-HJ-NP-Z]{8}$/);
    expect(groupData).toEqual({
      ownerId: "user-a",
      memberIds: ["user-a"],
      name: "Viaje",
      description: null,
      defaultCurrency: "EUR",
      joinCode: result.group.joinCode,
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    });

    const codeData = mockBatchSet.mock.calls[1][1];
    expect(codeData).toEqual({
      groupId: result.group.id,
      ownerId: "user-a",
      groupName: "Viaje",
    });

    const invitationData = mockBatchSet.mock.calls[2][1];
    expect(invitationData).toMatchObject({
      groupId: result.group.id,
      groupName: "Viaje",
      inviterId: "user-a",
      inviteeId: "user-b",
      pairId: "user-a__user-b",
      status: "pending",
    });
    expect(result.group.memberIds).toEqual(["user-a"]);
    expect(result.invitations).toHaveLength(1);
    expect(result.invitations[0].id.startsWith(`${result.group.id}__`)).toBe(
      true,
    );
  });

  it("refuses an invitee that would produce an empty pair id", async () => {
    await expect(
      createGroupWithInvitationsOperation({
        ownerId: "user-a",
        name: "Viaje",
        description: null,
        defaultCurrency: "EUR",
        inviteeIds: ["user-a"],
        createdAt: CREATED_AT,
      }),
    ).rejects.toBeInstanceOf(GroupOperationError);
    expect(mockBatchCommit).not.toHaveBeenCalled();
  });
});

describe("updateGroupOperation", () => {
  it("updates the metadata and renames the pending invitations", async () => {
    mockGetDoc.mockResolvedValue(documentSnapshot(GROUP_ID, GROUP_DOCUMENT));
    mockGetDocs.mockResolvedValue(
      querySnapshot([
        { id: `${GROUP_ID}__user-b`, data: () => INVITATION_DOCUMENT },
        {
          id: `${GROUP_ID}__user-c`,
          data: () => ({
            ...INVITATION_DOCUMENT,
            inviteeId: "user-c",
            pairId: "user-a__user-c",
            status: "rejected",
          }),
        },
      ]),
    );

    const group = await updateGroupOperation(GROUP_ID, {
      name: "Viaje Nuevo",
      description: "Finde",
      defaultCurrency: "USD",
      updatedAt: "2026-11-21T10:00:00.000Z",
    });

    expect(group).toMatchObject({
      id: GROUP_ID,
      name: "Viaje Nuevo",
      memberIds: ["user-a", "user-b"],
    });
    // The group, its code projection and the one pending invitation.
    expect(mockBatchUpdate).toHaveBeenCalledTimes(3);
    expect(mockBatchUpdate.mock.calls[0][1]).toEqual({
      name: "Viaje Nuevo",
      description: "Finde",
      defaultCurrency: "USD",
      updatedAt: "2026-11-21T10:00:00.000Z",
    });
    expect(mockBatchUpdate.mock.calls[1][1]).toEqual({
      groupName: "Viaje Nuevo",
    });
    expect(mockBatchUpdate.mock.calls[2][1]).toEqual({
      groupName: "Viaje Nuevo",
      updatedAt: "2026-11-21T10:00:00.000Z",
    });
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it("does not read the invitations when the name is unchanged", async () => {
    mockGetDoc.mockResolvedValue(documentSnapshot(GROUP_ID, GROUP_DOCUMENT));

    await updateGroupOperation(GROUP_ID, {
      name: "Viaje",
      description: "Finde",
      defaultCurrency: "EUR",
      updatedAt: "2026-11-21T10:00:00.000Z",
    });

    expect(mockGetDocs).not.toHaveBeenCalled();
    expect(mockBatchUpdate).toHaveBeenCalledTimes(1);
  });

  it("fails with GROUP_NOT_FOUND when the group is missing", async () => {
    mockGetDoc.mockResolvedValue(missingSnapshot());

    await expect(
      updateGroupOperation(GROUP_ID, {
        name: "Viaje",
        description: null,
        defaultCurrency: "EUR",
        updatedAt: CREATED_AT,
      }),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
  });
});

describe("removeGroupMemberOperation", () => {
  it("removes exactly one member in a transaction", async () => {
    mockTransactionGet.mockResolvedValue(
      documentSnapshot(GROUP_ID, GROUP_DOCUMENT),
    );

    const group = await removeGroupMemberOperation(
      GROUP_ID,
      "user-b",
      "2026-11-21T10:00:00.000Z",
    );

    expect(group.memberIds).toEqual(["user-a"]);
    expect(mockTransactionUpdate).toHaveBeenCalledTimes(1);
    expect(mockTransactionUpdate.mock.calls[0][1]).toEqual({
      memberIds: ["user-a"],
      updatedAt: "2026-11-21T10:00:00.000Z",
    });
  });

  it("never removes the owner", async () => {
    mockTransactionGet.mockResolvedValue(
      documentSnapshot(GROUP_ID, GROUP_DOCUMENT),
    );

    await expect(
      removeGroupMemberOperation(GROUP_ID, "user-a", CREATED_AT),
    ).rejects.toMatchObject({ code: "CANNOT_REMOVE_OWNER" });
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("fails for an unknown member and a missing group", async () => {
    mockTransactionGet.mockResolvedValue(
      documentSnapshot(GROUP_ID, GROUP_DOCUMENT),
    );

    await expect(
      removeGroupMemberOperation(GROUP_ID, "user-z", CREATED_AT),
    ).rejects.toMatchObject({ code: "MEMBER_NOT_FOUND" });

    mockTransactionGet.mockResolvedValue(missingSnapshot());
    await expect(
      removeGroupMemberOperation(GROUP_ID, "user-b", CREATED_AT),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
  });
});
