import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the modules.
import {
  documentSnapshot,
  missingSnapshot,
  mockDeleteDoc,
  mockGetDoc,
  mockGetDocs,
  mockSetDoc,
  mockUpdateDoc,
  mockWhere,
  querySnapshot,
  setupFriendsRepositoryMocks,
} from "./friends-repository.test-helpers";
import { FirebaseFriendsRepository } from "../firebase-friends.repository";

beforeEach(setupFriendsRepositoryMocks);

const requestData = {
  requesterId: "user-a",
  recipientId: "user-b",
  participantIds: ["user-a", "user-b"],
  status: "pending" as const,
  createdAt: "2026-11-14T10:00:00.000Z",
  updatedAt: "2026-11-14T10:00:00.000Z",
};

const request = {
  id: "user-a__user-b",
  ...requestData,
};

describe("FirebaseFriendsRepository friend requests", () => {
  it("reads a request by its pair id", async () => {
    mockGetDoc.mockResolvedValue(
      documentSnapshot("user-a__user-b", requestData),
    );

    await expect(
      new FirebaseFriendsRepository().getFriendRequest("user-a__user-b"),
    ).resolves.toEqual(request);
  });

  it("returns null when the request does not exist", async () => {
    mockGetDoc.mockResolvedValue(missingSnapshot());

    await expect(
      new FirebaseFriendsRepository().getFriendRequest("user-a__user-b"),
    ).resolves.toBeNull();
  });

  it("queries requests by participant and drops unmappable documents", async () => {
    mockGetDocs.mockResolvedValue(
      querySnapshot([
        { id: "user-a__user-b", data: () => requestData },
        { id: "broken", data: () => ({ recipientId: "user-b" }) },
      ]),
    );

    const requests = await new FirebaseFriendsRepository().getFriendRequests(
      "user-a",
    );

    expect(mockWhere).toHaveBeenCalledWith(
      "participantIds",
      "array-contains",
      "user-a",
    );
    expect(requests).toEqual([request]);
  });

  it("creates the request in the deterministic document", async () => {
    mockSetDoc.mockResolvedValue(undefined);

    const created = await new FirebaseFriendsRepository().createFriendRequest({
      id: "user-a__user-b",
      ...requestData,
    });

    expect(mockSetDoc).toHaveBeenCalledWith(
      { path: "friendRequests/user-a__user-b" },
      requestData,
    );
    expect(created).toEqual(request);
  });

  it("updates a request and reads the merged document back", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue(
      documentSnapshot("user-a__user-b", {
        ...requestData,
        status: "rejected",
      }),
    );

    const updated = await new FirebaseFriendsRepository().updateFriendRequest(
      "user-a__user-b",
      { status: "rejected", updatedAt: "2026-11-15T10:00:00.000Z" },
    );

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: "friendRequests/user-a__user-b" },
      { status: "rejected", updatedAt: "2026-11-15T10:00:00.000Z" },
    );
    expect(updated.status).toBe("rejected");
  });

  it("re-opens a request with the sender and recipient swapped", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue(
      documentSnapshot("user-a__user-b", {
        ...requestData,
        requesterId: "user-b",
        recipientId: "user-a",
      }),
    );

    await new FirebaseFriendsRepository().updateFriendRequest(
      "user-a__user-b",
      {
        status: "pending",
        requesterId: "user-b",
        recipientId: "user-a",
        updatedAt: "2026-11-15T10:00:00.000Z",
      },
    );

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: "friendRequests/user-a__user-b" },
      {
        status: "pending",
        requesterId: "user-b",
        recipientId: "user-a",
        updatedAt: "2026-11-15T10:00:00.000Z",
      },
    );
  });

  it("fails when the request disappears after the update", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue(missingSnapshot());

    await expect(
      new FirebaseFriendsRepository().updateFriendRequest("user-a__user-b", {
        status: "cancelled",
        updatedAt: "2026-11-15T10:00:00.000Z",
      }),
    ).rejects.toMatchObject({ code: "REQUEST_NOT_FOUND" });
  });

  it("deletes a request document", async () => {
    mockDeleteDoc.mockResolvedValue(undefined);

    await new FirebaseFriendsRepository().deleteFriendRequest(
      "user-a__user-b",
    );

    expect(mockDeleteDoc).toHaveBeenCalledWith({
      path: "friendRequests/user-a__user-b",
    });
  });
});
