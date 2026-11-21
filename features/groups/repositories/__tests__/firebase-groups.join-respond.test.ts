import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the modules.
import {
  GROUP_DOCUMENT,
  GROUP_ID,
  documentSnapshot,
  missingSnapshot,
  mockTransactionGet,
  mockTransactionUpdate,
  setupGroupsRepositoryMocks,
} from "./groups-repository.test-helpers";
import { respondToGroupJoinRequestOperation } from "../group-join.operations";

beforeEach(setupGroupsRepositoryMocks);

const REQUEST_ID = `${GROUP_ID}__user-c`;
const REQUEST_DOCUMENT = {
  groupId: GROUP_ID,
  requesterId: "user-c",
  joinCode: "ABCD2345",
  status: "pending",
  createdAt: "2026-11-20T10:00:00.000Z",
  updatedAt: "2026-11-20T10:00:00.000Z",
};
const GROUP = { ...GROUP_DOCUMENT, memberIds: ["user-a", "user-b"] };
const UPDATED_AT = "2026-11-21T10:00:00.000Z";

function respondWith(request: unknown, group: unknown) {
  mockTransactionGet.mockReset();
  mockTransactionGet
    .mockResolvedValueOnce(request)
    .mockResolvedValueOnce(group);
}

function input(decision: "accepted" | "rejected" = "accepted") {
  return {
    requestId: REQUEST_ID,
    groupId: GROUP_ID,
    viewerUid: "user-a",
    decision,
    updatedAt: UPDATED_AT,
  } as const;
}

describe("respondToGroupJoinRequestOperation", () => {
  it("accepts the request and appends the requester in one transaction", async () => {
    respondWith(
      documentSnapshot(REQUEST_ID, REQUEST_DOCUMENT),
      documentSnapshot(GROUP_ID, GROUP),
    );

    const result = await respondToGroupJoinRequestOperation(input());

    expect(result.group.memberIds).toEqual(["user-a", "user-b", "user-c"]);
    expect(result.request.status).toBe("accepted");
    expect(mockTransactionUpdate).toHaveBeenCalledTimes(2);
    expect(mockTransactionUpdate.mock.calls[0][1]).toEqual({
      status: "accepted",
      updatedAt: UPDATED_AT,
    });
    expect(mockTransactionUpdate.mock.calls[1][1]).toEqual({
      memberIds: ["user-a", "user-b", "user-c"],
      updatedAt: UPDATED_AT,
    });
  });

  it("rejects the request without touching the group", async () => {
    respondWith(
      documentSnapshot(REQUEST_ID, REQUEST_DOCUMENT),
      documentSnapshot(GROUP_ID, GROUP),
    );

    const result = await respondToGroupJoinRequestOperation(input("rejected"));

    expect(result.request.status).toBe("rejected");
    expect(result.group.memberIds).toEqual(GROUP.memberIds);
    expect(mockTransactionUpdate).toHaveBeenCalledTimes(1);
    expect(mockTransactionUpdate.mock.calls[0][1]).toEqual({
      status: "rejected",
      updatedAt: UPDATED_AT,
    });
  });

  it("rejects a caller that is not the owner", async () => {
    respondWith(
      documentSnapshot(REQUEST_ID, REQUEST_DOCUMENT),
      documentSnapshot(GROUP_ID, GROUP),
    );

    await expect(
      respondToGroupJoinRequestOperation({ ...input(), viewerUid: "user-b" }),
    ).rejects.toMatchObject({ code: "NOT_GROUP_OWNER" });
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("requires a pending request of the same group", async () => {
    respondWith(
      documentSnapshot(REQUEST_ID, {
        ...REQUEST_DOCUMENT,
        status: "rejected",
      }),
      documentSnapshot(GROUP_ID, GROUP),
    );

    await expect(
      respondToGroupJoinRequestOperation(input()),
    ).rejects.toMatchObject({ code: "JOIN_REQUEST_NOT_PENDING" });

    respondWith(
      documentSnapshot(REQUEST_ID, REQUEST_DOCUMENT),
      documentSnapshot(GROUP_ID, GROUP),
    );

    await expect(
      respondToGroupJoinRequestOperation({
        ...input(),
        groupId: "user-a__other",
      }),
    ).rejects.toMatchObject({ code: "JOIN_REQUEST_NOT_FOUND" });
  });

  it("maps a missing request or group to its not-found code", async () => {
    respondWith(missingSnapshot(), missingSnapshot());
    await expect(
      respondToGroupJoinRequestOperation(input()),
    ).rejects.toMatchObject({ code: "JOIN_REQUEST_NOT_FOUND" });

    respondWith(
      documentSnapshot(REQUEST_ID, REQUEST_DOCUMENT),
      missingSnapshot(),
    );
    await expect(
      respondToGroupJoinRequestOperation(input()),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
  });

  it("refuses an existing member and a full group", async () => {
    respondWith(
      documentSnapshot(REQUEST_ID, REQUEST_DOCUMENT),
      documentSnapshot(GROUP_ID, {
        ...GROUP_DOCUMENT,
        memberIds: ["user-a", "user-b", "user-c"],
      }),
    );
    await expect(
      respondToGroupJoinRequestOperation(input()),
    ).rejects.toMatchObject({ code: "ALREADY_MEMBER" });

    const full = ["user-a", ...Array.from({ length: 19 }, (_, i) => `u-${i}`)];
    respondWith(
      documentSnapshot(REQUEST_ID, REQUEST_DOCUMENT),
      documentSnapshot(GROUP_ID, { ...GROUP_DOCUMENT, memberIds: full }),
    );
    await expect(
      respondToGroupJoinRequestOperation(input()),
    ).rejects.toMatchObject({ code: "GROUP_FULL" });
  });
});
