import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the modules.
import {
  GROUP_ID,
  INVITATION_DOCUMENT,
  INVITATION_ID,
  documentSnapshot,
  mockGetDoc,
  mockGetDocs,
  mockSetDoc,
  mockUpdateDoc,
  querySnapshot,
  setupGroupsRepositoryMocks,
} from "./groups-repository.test-helpers";
import {
  inviteMembersOperation,
  updateGroupInvitationStatusOperation,
} from "../group-invitation.operations";
import { GroupOperationError } from "../../services/group.errors";

beforeEach(setupGroupsRepositoryMocks);

const UPDATED_AT = "2026-11-21T10:00:00.000Z";

const baseInput = {
  groupId: GROUP_ID,
  groupName: "Viaje",
  inviterId: "user-a",
  updatedAt: UPDATED_AT,
};

describe("inviteMembersOperation", () => {
  it("creates an invitation for a friend without one", async () => {
    mockGetDocs.mockResolvedValue(querySnapshot([]));

    const invitations = await inviteMembersOperation({
      ...baseInput,
      inviteeIds: ["user-b"],
    });

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(mockSetDoc.mock.calls[0][1]).toMatchObject({
      groupId: GROUP_ID,
      groupName: "Viaje",
      inviterId: "user-a",
      inviteeId: "user-b",
      pairId: "user-a__user-b",
      status: "pending",
    });
    expect(invitations).toHaveLength(1);
  });

  it("returns an existing pending invitation untouched", async () => {
    mockGetDocs.mockResolvedValue(
      querySnapshot([{ id: INVITATION_ID, data: () => INVITATION_DOCUMENT }]),
    );

    const invitations = await inviteMembersOperation({
      ...baseInput,
      inviteeIds: ["user-b"],
    });

    expect(mockSetDoc).not.toHaveBeenCalled();
    expect(mockUpdateDoc).not.toHaveBeenCalled();
    expect(invitations[0]).toMatchObject({ status: "pending" });
  });

  it("reopens a rejected invitation and refreshes its group name", async () => {
    mockGetDocs.mockResolvedValue(
      querySnapshot([
        {
          id: INVITATION_ID,
          data: () => ({ ...INVITATION_DOCUMENT, status: "rejected" }),
        },
      ]),
    );

    const invitations = await inviteMembersOperation({
      ...baseInput,
      groupName: "Viaje Nuevo",
      inviteeIds: ["user-b"],
    });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
    expect(mockUpdateDoc.mock.calls[0][1]).toEqual({
      status: "pending",
      updatedAt: UPDATED_AT,
    });
    expect(mockUpdateDoc.mock.calls[1][1]).toEqual({
      groupName: "Viaje Nuevo",
      updatedAt: UPDATED_AT,
    });
    expect(invitations[0]).toMatchObject({
      status: "pending",
      groupName: "Viaje Nuevo",
    });
  });

  it("reopens without a rename when the stored name already matches", async () => {
    mockGetDocs.mockResolvedValue(
      querySnapshot([
        {
          id: INVITATION_ID,
          data: () => ({ ...INVITATION_DOCUMENT, status: "cancelled" }),
        },
      ]),
    );

    await inviteMembersOperation({ ...baseInput, inviteeIds: ["user-b"] });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
  });

  it("refuses an invitee that would produce an empty pair id", async () => {
    mockGetDocs.mockResolvedValue(querySnapshot([]));

    await expect(
      inviteMembersOperation({ ...baseInput, inviteeIds: ["user-a"] }),
    ).rejects.toBeInstanceOf(GroupOperationError);
    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});

describe("updateGroupInvitationStatusOperation", () => {
  it("patches the status and returns the stored invitation", async () => {
    mockGetDoc.mockResolvedValue(
      documentSnapshot(INVITATION_ID, {
        ...INVITATION_DOCUMENT,
        status: "cancelled",
      }),
    );

    const invitation = await updateGroupInvitationStatusOperation(
      INVITATION_ID,
      "cancelled",
      UPDATED_AT,
    );

    expect(mockUpdateDoc.mock.calls[0][1]).toEqual({
      status: "cancelled",
      updatedAt: UPDATED_AT,
    });
    expect(invitation.status).toBe("cancelled");
  });

  it("fails when the invitation disappeared", async () => {
    mockGetDoc.mockResolvedValue({
      id: "",
      exists: () => false,
      data: () => undefined,
    });

    await expect(
      updateGroupInvitationStatusOperation(
        INVITATION_ID,
        "rejected",
        UPDATED_AT,
      ),
    ).rejects.toMatchObject({ code: "INVITATION_NOT_FOUND" });
  });
});
