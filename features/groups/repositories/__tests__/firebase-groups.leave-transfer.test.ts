import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the modules.
import {
  GROUP_DOCUMENT,
  GROUP_ID,
  documentSnapshot,
  missingSnapshot,
  mockTransactionGet,
  mockTransactionSet,
  mockTransactionUpdate,
  setupGroupsRepositoryMocks,
} from "./groups-repository.test-helpers";
import { leaveGroupOperation } from "../group-member-leave.operation";
import { transferGroupOwnershipOperation } from "../group-owner-transfer.operation";

beforeEach(setupGroupsRepositoryMocks);

const UPDATED_AT = "2026-11-21T10:00:00.000Z";
const activity = { kind: "activity", id: "activity-1" };

function leaveInput(overrides: Record<string, unknown> = {}) {
  return {
    groupId: GROUP_ID,
    memberId: "user-b",
    targetName: "Bea",
    updatedAt: UPDATED_AT,
    ...overrides,
  };
}

function transferInput(overrides: Record<string, unknown> = {}) {
  return {
    groupId: GROUP_ID,
    actorId: "user-a",
    newOwnerId: "user-b",
    updatedAt: UPDATED_AT,
    ...overrides,
  };
}

describe("leaveGroupOperation", () => {
  it("removes the leaving member and appends the member-left event", async () => {
    mockTransactionGet.mockResolvedValue(
      documentSnapshot(GROUP_ID, GROUP_DOCUMENT),
    );

    const group = await leaveGroupOperation(leaveInput());

    expect(group.memberIds).toEqual(["user-a"]);
    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      { id: GROUP_ID, path: `groups/${GROUP_ID}` },
      { memberIds: ["user-a"], updatedAt: UPDATED_AT },
    );
    expect(mockTransactionSet).toHaveBeenCalledWith(
      activity,
      expect.objectContaining({
        type: "member-left",
        actorId: "user-b",
        targetUserId: "user-b",
        targetName: "Bea",
        createdAt: UPDATED_AT,
      }),
    );
  });

  it("never lets the owner leave", async () => {
    mockTransactionGet.mockResolvedValue(
      documentSnapshot(GROUP_ID, GROUP_DOCUMENT),
    );

    await expect(
      leaveGroupOperation(leaveInput({ memberId: "user-a" })),
    ).rejects.toMatchObject({ code: "CANNOT_REMOVE_OWNER" });
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it("rejects a non-member and a missing group", async () => {
    mockTransactionGet.mockResolvedValue(
      documentSnapshot(GROUP_ID, GROUP_DOCUMENT),
    );

    await expect(
      leaveGroupOperation(leaveInput({ memberId: "user-z" })),
    ).rejects.toMatchObject({ code: "MEMBER_NOT_FOUND" });

    mockTransactionGet.mockResolvedValue(missingSnapshot());
    await expect(leaveGroupOperation(leaveInput())).rejects.toMatchObject({
      code: "GROUP_NOT_FOUND",
    });
  });
});

describe("transferGroupOwnershipOperation", () => {
  it("promotes the member and reorders memberIds owner-first", async () => {
    mockTransactionGet.mockResolvedValue(
      documentSnapshot(GROUP_ID, GROUP_DOCUMENT),
    );

    const group = await transferGroupOwnershipOperation(transferInput());

    expect(group).toMatchObject({
      ownerId: "user-b",
      createdBy: "user-a",
      memberIds: ["user-b", "user-a"],
    });
    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      { id: GROUP_ID, path: `groups/${GROUP_ID}` },
      {
        ownerId: "user-b",
        memberIds: ["user-b", "user-a"],
        updatedAt: UPDATED_AT,
      },
    );
    expect(mockTransactionSet).toHaveBeenCalledWith(
      activity,
      expect.objectContaining({
        type: "owner-transferred",
        actorId: "user-a",
        targetUserId: "user-b",
        previousOwnerId: "user-a",
        newOwnerId: "user-b",
      }),
    );
    // The join-code projection follows the new owner in the same commit.
    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      { id: "ABCD2345", path: "groupCodes/ABCD2345" },
      { ownerId: "user-b" },
    );
  });

  it("rejects a caller that is not the owner", async () => {
    mockTransactionGet.mockResolvedValue(
      documentSnapshot(GROUP_ID, GROUP_DOCUMENT),
    );

    await expect(
      transferGroupOwnershipOperation(transferInput({ actorId: "user-b" })),
    ).rejects.toMatchObject({ code: "NOT_GROUP_OWNER" });
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects the owner itself, a stranger and a missing group", async () => {
    mockTransactionGet.mockResolvedValue(
      documentSnapshot(GROUP_ID, GROUP_DOCUMENT),
    );

    for (const newOwnerId of ["user-a", "user-z"]) {
      await expect(
        transferGroupOwnershipOperation(transferInput({ newOwnerId })),
      ).rejects.toMatchObject({ code: "INVALID_OWNERSHIP_TARGET" });
    }

    mockTransactionGet.mockResolvedValue(missingSnapshot());
    await expect(
      transferGroupOwnershipOperation(transferInput()),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
  });
});
