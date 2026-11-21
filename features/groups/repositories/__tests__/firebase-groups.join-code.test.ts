import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the modules.
import {
  GROUP_DOCUMENT,
  GROUP_ID,
  documentSnapshot,
  missingSnapshot,
  mockBatchCommit,
  mockBatchSet,
  mockBatchUpdate,
  mockGetDoc,
  setupGroupsRepositoryMocks,
} from "./groups-repository.test-helpers";
import { ensureGroupJoinCodeOperation } from "../group-join.operations";

beforeEach(setupGroupsRepositoryMocks);

const LEGACY_GROUP = { ...GROUP_DOCUMENT };
delete (LEGACY_GROUP as { joinCode?: unknown }).joinCode;

const INPUT = {
  groupId: GROUP_ID,
  code: "WXYZ2345",
  updatedAt: "2026-11-21T10:00:00.000Z",
};

describe("ensureGroupJoinCodeOperation", () => {
  it("returns an existing code without writing", async () => {
    mockGetDoc.mockResolvedValue(documentSnapshot(GROUP_ID, GROUP_DOCUMENT));

    const group = await ensureGroupJoinCodeOperation(INPUT);

    expect(group.joinCode).toBe("ABCD2345");
    expect(mockBatchCommit).not.toHaveBeenCalled();
  });

  it("writes the group code and the projection in one batch", async () => {
    mockGetDoc.mockResolvedValue(documentSnapshot(GROUP_ID, LEGACY_GROUP));

    const group = await ensureGroupJoinCodeOperation(INPUT);

    expect(group.joinCode).toBe(INPUT.code);
    expect(mockBatchUpdate).toHaveBeenCalledTimes(1);
    expect(mockBatchUpdate.mock.calls[0][1]).toEqual({
      joinCode: INPUT.code,
      updatedAt: INPUT.updatedAt,
    });
    expect(mockBatchSet).toHaveBeenCalledWith(
      expect.objectContaining({ id: INPUT.code }),
      { groupId: GROUP_ID, ownerId: "user-a", groupName: "Viaje" },
    );
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it("fails for a missing group or an invalid code", async () => {
    mockGetDoc.mockResolvedValue(missingSnapshot());
    await expect(ensureGroupJoinCodeOperation(INPUT)).rejects.toMatchObject({
      code: "GROUP_NOT_FOUND",
    });

    mockGetDoc.mockResolvedValue(documentSnapshot(GROUP_ID, LEGACY_GROUP));
    await expect(
      ensureGroupJoinCodeOperation({ ...INPUT, code: "ABCD2340" }),
    ).rejects.toMatchObject({ code: "INVALID_JOIN_CODE" });
  });
});
