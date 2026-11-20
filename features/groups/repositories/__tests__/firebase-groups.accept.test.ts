import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the modules.
import {
  GROUP_DOCUMENT,
  GROUP_ID,
  INVITATION_DOCUMENT,
  INVITATION_ID,
  documentSnapshot,
  missingSnapshot,
  mockDoc,
  mockGetDoc,
  mockTransactionGet,
  mockTransactionUpdate,
  setupGroupsRepositoryMocks,
} from "./groups-repository.test-helpers";
import { acceptGroupInvitationOperation } from "../group-accept.operation";

beforeEach(setupGroupsRepositoryMocks);

const invitation = documentSnapshot(INVITATION_ID, INVITATION_DOCUMENT);
const group = documentSnapshot(GROUP_ID, {
  ...GROUP_DOCUMENT,
  memberIds: ["user-a"],
});

function respondWith(invitationSnapshot: unknown, groupSnapshot: unknown) {
  mockTransactionGet
    .mockResolvedValueOnce(invitationSnapshot)
    .mockResolvedValueOnce(groupSnapshot);
}

describe("acceptGroupInvitationOperation", () => {
  it("appends the invitee and accepts the invitation in one transaction", async () => {
    respondWith(invitation, group);

    const result = await acceptGroupInvitationOperation(
      "user-b",
      INVITATION_ID,
    );

    expect(result.memberIds).toEqual(["user-a", "user-b"]);
    expect(mockTransactionUpdate).toHaveBeenCalledTimes(2);
    expect(mockTransactionUpdate.mock.calls[0][1]).toMatchObject({
      status: "accepted",
    });
    expect(mockTransactionUpdate.mock.calls[1][1]).toMatchObject({
      memberIds: ["user-a", "user-b"],
    });
  });

  it("rejects a caller that is not the invitee", async () => {
    respondWith(invitation, group);

    await expect(
      acceptGroupInvitationOperation("user-c", INVITATION_ID),
    ).rejects.toMatchObject({ code: "NOT_INVITEE" });
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("requires a pending invitation", async () => {
    respondWith(
      documentSnapshot(INVITATION_ID, {
        ...INVITATION_DOCUMENT,
        status: "rejected",
      }),
      group,
    );

    await expect(
      acceptGroupInvitationOperation("user-b", INVITATION_ID),
    ).rejects.toMatchObject({ code: "INVITATION_NOT_PENDING" });
  });

  it("maps a missing invitation to INVITATION_NOT_FOUND", async () => {
    respondWith(missingSnapshot(), group);

    await expect(
      acceptGroupInvitationOperation("user-b", INVITATION_ID),
    ).rejects.toMatchObject({ code: "INVITATION_NOT_FOUND" });
  });

  it("requires the group to still exist", async () => {
    respondWith(invitation, missingSnapshot());

    await expect(
      acceptGroupInvitationOperation("user-b", INVITATION_ID),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
  });

  it("rejects an existing member and a full group", async () => {
    respondWith(
      invitation,
      documentSnapshot(GROUP_ID, {
        ...GROUP_DOCUMENT,
        memberIds: ["user-a", "user-b"],
      }),
    );

    await expect(
      acceptGroupInvitationOperation("user-b", INVITATION_ID),
    ).rejects.toMatchObject({ code: "ALREADY_MEMBER" });

    const full = ["user-a", ...Array.from({ length: 19 }, (_, i) => `user-${i}`)];
    respondWith(
      invitation,
      documentSnapshot(GROUP_ID, { ...GROUP_DOCUMENT, memberIds: full }),
    );

    await expect(
      acceptGroupInvitationOperation("user-b", INVITATION_ID),
    ).rejects.toMatchObject({ code: "GROUP_FULL" });
  });

  it("reads the invitation and the group by their deterministic refs", async () => {
    respondWith(invitation, group);

    await acceptGroupInvitationOperation("user-b", INVITATION_ID);

    expect(mockDoc).toHaveBeenCalledWith({}, "groupInvitations", INVITATION_ID);
    expect(mockDoc).toHaveBeenCalledWith({}, "groups", GROUP_ID);
    expect(mockGetDoc).not.toHaveBeenCalled();
  });
});
