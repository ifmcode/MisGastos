import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the modules.
import {
  GROUP_DOCUMENT,
  GROUP_ID,
  INVITATION_DOCUMENT,
  INVITATION_ID,
  documentSnapshot,
  missingSnapshot,
  mockGetDoc,
  mockGetDocs,
  mockWhere,
  querySnapshot,
  setupGroupsRepositoryMocks,
} from "./groups-repository.test-helpers";
import { FirebaseGroupsRepository } from "../firebase-groups.repository";

beforeEach(setupGroupsRepositoryMocks);

function repository() {
  return new FirebaseGroupsRepository();
}

describe("FirebaseGroupsRepository group reads", () => {
  it("queries the member groups and drops malformed documents", async () => {
    mockGetDocs.mockResolvedValue(
      querySnapshot([
        { id: GROUP_ID, data: () => GROUP_DOCUMENT },
        { id: "broken", data: () => ({ ...GROUP_DOCUMENT, name: "" }) },
        { id: "group-without-owner-prefix", data: () => GROUP_DOCUMENT },
      ]),
    );

    const groups = await repository().getGroups("user-a");

    expect(mockWhere).toHaveBeenCalledWith(
      "memberIds",
      "array-contains",
      "user-a",
    );
    expect(groups.map((group) => group.id)).toEqual([GROUP_ID]);
  });

  it("reads one group and maps a missing document to null", async () => {
    mockGetDoc.mockResolvedValue(documentSnapshot(GROUP_ID, GROUP_DOCUMENT));

    await expect(repository().getGroup(GROUP_ID)).resolves.toMatchObject({
      id: GROUP_ID,
      memberIds: ["user-a", "user-b"],
    });

    mockGetDoc.mockResolvedValue(missingSnapshot());
    await expect(repository().getGroup("user-a__group-2")).resolves.toBeNull();
  });

  it("reads one invitation and maps a malformed one to null", async () => {
    mockGetDoc.mockResolvedValue(
      documentSnapshot(INVITATION_ID, INVITATION_DOCUMENT),
    );

    await expect(
      repository().getGroupInvitation(INVITATION_ID),
    ).resolves.toMatchObject({ id: INVITATION_ID, status: "pending" });

    mockGetDoc.mockResolvedValue(
      documentSnapshot(INVITATION_ID, {
        ...INVITATION_DOCUMENT,
        status: "expired",
      }),
    );
    await expect(
      repository().getGroupInvitation(INVITATION_ID),
    ).resolves.toBeNull();
  });

  it("lists the owner invitations of one group", async () => {
    const otherGroupId = "user-a__group-2";
    mockGetDocs.mockResolvedValue(
      querySnapshot([
        { id: INVITATION_ID, data: () => INVITATION_DOCUMENT },
        {
          id: `${otherGroupId}__user-b`,
          data: () => ({ ...INVITATION_DOCUMENT, groupId: otherGroupId }),
        },
        { id: "broken", data: () => ({}) },
      ]),
    );

    const invitations = await repository().getGroupInvitations(
      "user-a",
      GROUP_ID,
    );

    expect(mockWhere).toHaveBeenCalledWith("inviterId", "==", "user-a");
    expect(invitations.map((item) => item.id)).toEqual([INVITATION_ID]);
  });

  it("lists only pending received invitations, newest first", async () => {
    const older = "user-a__group-1";
    const newer = "user-a__group-2";
    const rejected = "user-a__group-3";
    mockGetDocs.mockResolvedValue(
      querySnapshot([
        {
          id: `${older}__user-b`,
          data: () => ({
            ...INVITATION_DOCUMENT,
            createdAt: "2026-11-18T10:00:00.000Z",
          }),
        },
        {
          id: `${newer}__user-b`,
          data: () => ({
            ...INVITATION_DOCUMENT,
            groupId: newer,
            createdAt: "2026-11-20T10:00:00.000Z",
          }),
        },
        {
          id: `${rejected}__user-b`,
          data: () => ({
            ...INVITATION_DOCUMENT,
            groupId: rejected,
            status: "rejected",
          }),
        },
      ]),
    );

    const invitations = await repository().getPendingInvitations("user-b");

    expect(mockWhere).toHaveBeenCalledWith("inviteeId", "==", "user-b");
    expect(invitations.map((item) => item.groupId)).toEqual([newer, older]);
  });
});
