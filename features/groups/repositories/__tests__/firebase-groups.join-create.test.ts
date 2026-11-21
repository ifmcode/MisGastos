import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the modules.
import {
  GROUP_ID,
  mockDoc,
  mockSetDoc,
  setupGroupsRepositoryMocks,
} from "./groups-repository.test-helpers";
import { createGroupJoinRequestOperation } from "../group-join.operations";

beforeEach(setupGroupsRepositoryMocks);

const INPUT = {
  groupId: GROUP_ID,
  requesterId: "user-b",
  joinCode: "abcd-2345",
  createdAt: "2026-11-20T10:00:00.000Z",
};

describe("createGroupJoinRequestOperation", () => {
  it("writes a pending request under the deterministic id", async () => {
    const request = await createGroupJoinRequestOperation(INPUT);

    expect(request).toEqual({
      id: `${GROUP_ID}__user-b`,
      groupId: GROUP_ID,
      requesterId: "user-b",
      joinCode: "ABCD2345",
      status: "pending",
      createdAt: INPUT.createdAt,
      updatedAt: INPUT.createdAt,
    });
    expect(mockDoc).toHaveBeenCalledWith(
      {},
      "groupJoinRequests",
      `${GROUP_ID}__user-b`,
    );
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: `${GROUP_ID}__user-b` }),
      {
        groupId: GROUP_ID,
        requesterId: "user-b",
        joinCode: "ABCD2345",
        status: "pending",
        createdAt: INPUT.createdAt,
        updatedAt: INPUT.createdAt,
      },
    );
  });

  it("refuses an invalid code before writing", async () => {
    await expect(
      createGroupJoinRequestOperation({ ...INPUT, joinCode: "ABCD2340" }),
    ).rejects.toMatchObject({ code: "INVALID_JOIN_CODE" });
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it("propagates the denied update of a duplicate request", async () => {
    const denied = Object.assign(new Error("permission-denied"), {
      code: "permission-denied",
    });
    mockSetDoc.mockRejectedValue(denied);

    await expect(createGroupJoinRequestOperation(INPUT)).rejects.toBe(denied);
  });
});
