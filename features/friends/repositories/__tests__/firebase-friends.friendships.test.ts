import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the modules.
import {
  documentSnapshot,
  missingSnapshot,
  mockDeleteDoc,
  mockGetDoc,
  mockGetDocs,
  mockTransactionDelete,
  mockTransactionGet,
  mockTransactionSet,
  mockWhere,
  querySnapshot,
  setupFriendsRepositoryMocks,
} from "./friends-repository.test-helpers";
import { FirebaseFriendsRepository } from "../firebase-friends.repository";

beforeEach(setupFriendsRepositoryMocks);

const friendshipData = {
  memberIds: ["user-a", "user-b"],
  requesterId: "user-a",
  recipientId: "user-b",
  createdAt: "2026-11-14T10:00:00.000Z",
};

const pendingRequestData = {
  requesterId: "user-a",
  recipientId: "user-b",
  participantIds: ["user-a", "user-b"],
  status: "pending",
  createdAt: "2026-11-14T10:00:00.000Z",
  updatedAt: "2026-11-14T10:00:00.000Z",
};

describe("FirebaseFriendsRepository friendships", () => {
  it("reads a friendship by pair id", async () => {
    mockGetDoc.mockResolvedValue(
      documentSnapshot("user-a__user-b", friendshipData),
    );

    await expect(
      new FirebaseFriendsRepository().getFriendship("user-a__user-b"),
    ).resolves.toEqual({ id: "user-a__user-b", ...friendshipData });
  });

  it("returns null when the friendship does not exist", async () => {
    mockGetDoc.mockResolvedValue(missingSnapshot());

    await expect(
      new FirebaseFriendsRepository().getFriendship("user-a__user-b"),
    ).resolves.toBeNull();
  });

  it("lists friendships by member and drops unmappable documents", async () => {
    mockGetDocs.mockResolvedValue(
      querySnapshot([
        { id: "user-a__user-b", data: () => friendshipData },
        { id: "broken", data: () => ({}) },
      ]),
    );

    const friendships = await new FirebaseFriendsRepository().getFriendships(
      "user-a",
    );

    expect(mockWhere).toHaveBeenCalledWith(
      "memberIds",
      "array-contains",
      "user-a",
    );
    expect(friendships).toEqual([{ id: "user-a__user-b", ...friendshipData }]);
  });

  it("deletes a friendship document", async () => {
    mockDeleteDoc.mockResolvedValue(undefined);

    await new FirebaseFriendsRepository().deleteFriendship("user-a__user-b");

    expect(mockDeleteDoc).toHaveBeenCalledWith({
      path: "friendships/user-a__user-b",
    });
  });
});

describe("FirebaseFriendsRepository acceptFriendRequest", () => {
  it("creates the friendship and deletes the pending request atomically", async () => {
    mockTransactionGet.mockResolvedValue(
      documentSnapshot("user-a__user-b", pendingRequestData),
    );

    const friendship = await new FirebaseFriendsRepository().acceptFriendRequest(
      "user-b",
      "user-a__user-b",
    );

    expect(mockTransactionSet).toHaveBeenCalledWith(
      { path: "friendships/user-a__user-b" },
      {
        memberIds: ["user-a", "user-b"],
        requesterId: "user-a",
        recipientId: "user-b",
        createdAt: expect.any(String),
      },
    );
    expect(mockTransactionDelete).toHaveBeenCalledWith({
      path: "friendRequests/user-a__user-b",
    });
    expect(friendship).toMatchObject({
      id: "user-a__user-b",
      memberIds: ["user-a", "user-b"],
      recipientId: "user-b",
    });
  });

  it("fails when the request is missing", async () => {
    mockTransactionGet.mockResolvedValue(missingSnapshot());

    await expect(
      new FirebaseFriendsRepository().acceptFriendRequest(
        "user-b",
        "user-a__user-b",
      ),
    ).rejects.toMatchObject({ code: "REQUEST_NOT_FOUND" });
    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it("fails when the request cannot be mapped", async () => {
    mockTransactionGet.mockResolvedValue(
      documentSnapshot("user-a__user-b", { recipientId: "user-b" }),
    );

    await expect(
      new FirebaseFriendsRepository().acceptFriendRequest(
        "user-b",
        "user-a__user-b",
      ),
    ).rejects.toMatchObject({ code: "REQUEST_NOT_FOUND" });
  });

  it("fails when the viewer is not a participant", async () => {
    mockTransactionGet.mockResolvedValue(
      documentSnapshot("user-a__user-b", pendingRequestData),
    );

    await expect(
      new FirebaseFriendsRepository().acceptFriendRequest(
        "user-c",
        "user-a__user-b",
      ),
    ).rejects.toMatchObject({ code: "NOT_REQUEST_RECIPIENT" });
  });

  it("fails when the viewer is the sender", async () => {
    mockTransactionGet.mockResolvedValue(
      documentSnapshot("user-a__user-b", pendingRequestData),
    );

    await expect(
      new FirebaseFriendsRepository().acceptFriendRequest(
        "user-a",
        "user-a__user-b",
      ),
    ).rejects.toMatchObject({ code: "NOT_REQUEST_RECIPIENT" });
  });

  it("fails when the request is not pending anymore", async () => {
    mockTransactionGet.mockResolvedValue(
      documentSnapshot("user-a__user-b", {
        ...pendingRequestData,
        status: "cancelled",
      }),
    );

    await expect(
      new FirebaseFriendsRepository().acceptFriendRequest(
        "user-b",
        "user-a__user-b",
      ),
    ).rejects.toMatchObject({ code: "REQUEST_NOT_PENDING" });
    expect(mockTransactionDelete).not.toHaveBeenCalled();
  });
});
