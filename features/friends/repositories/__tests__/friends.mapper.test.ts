import { describe, expect, it } from "@jest/globals";

import {
  mapFriendRequestDocument,
  mapFriendshipDocument,
  mapPublicProfileDocument,
} from "../friends.mapper";

describe("mapPublicProfileDocument", () => {
  it("always uses the document id as the identity", () => {
    const profile = mapPublicProfileDocument("user-1", {
      uid: "someone-else",
      displayName: " Ada ",
      email: " Ada@Example.com ",
      createdAt: "2026-11-14T10:00:00.000Z",
      updatedAt: "2026-11-14T11:00:00.000Z",
    });

    expect(profile).toEqual({
      uid: "user-1",
      displayName: "Ada",
      email: "Ada@Example.com",
      createdAt: "2026-11-14T10:00:00.000Z",
      updatedAt: "2026-11-14T11:00:00.000Z",
    });
  });

  it("falls back to safe values for a legacy document", () => {
    expect(mapPublicProfileDocument("user-1", {})).toEqual({
      uid: "user-1",
      displayName: null,
      email: "",
      createdAt: "",
      updatedAt: "",
    });
  });

  it("treats a blank display name as missing", () => {
    expect(
      mapPublicProfileDocument("user-1", { displayName: "   " }).displayName,
    ).toBeNull();
  });
});

describe("mapFriendRequestDocument", () => {
  it("maps a stored pending request", () => {
    expect(
      mapFriendRequestDocument("user-a__user-b", {
        requesterId: "user-a",
        recipientId: "user-b",
        participantIds: ["user-a", "user-b"],
        status: "pending",
        createdAt: "2026-11-14T10:00:00.000Z",
        updatedAt: "2026-11-14T10:00:00.000Z",
      }),
    ).toEqual({
      id: "user-a__user-b",
      requesterId: "user-a",
      recipientId: "user-b",
      participantIds: ["user-a", "user-b"],
      status: "pending",
      createdAt: "2026-11-14T10:00:00.000Z",
      updatedAt: "2026-11-14T10:00:00.000Z",
    });
  });

  it("keeps the stored rejected and cancelled statuses", () => {
    const base = {
      requesterId: "user-a",
      recipientId: "user-b",
      participantIds: ["user-a", "user-b"],
    };

    expect(mapFriendRequestDocument("id", { ...base, status: "rejected" })?.status)
      .toBe("rejected");
    expect(mapFriendRequestDocument("id", { ...base, status: "cancelled" })?.status)
      .toBe("cancelled");
  });

  it("rebuilds legacy or corrupted pairs from requester and recipient", () => {
    const derived = mapFriendRequestDocument("user-a__user-b", {
      requesterId: "user-a",
      recipientId: "user-b",
      status: "pending",
    });

    expect(derived?.participantIds).toEqual(["user-a", "user-b"]);

    const unsorted = mapFriendRequestDocument("user-a__user-b", {
      requesterId: "user-a",
      recipientId: "user-b",
      participantIds: ["user-b", "user-a"],
    });

    expect(unsorted?.participantIds).toEqual(["user-a", "user-b"]);
  });

  it("drops requests without a usable pair and defaults unknown statuses", () => {
    expect(mapFriendRequestDocument("id", { recipientId: "user-b" })).toBeNull();
    expect(
      mapFriendRequestDocument("id", {
        requesterId: "user-a",
        recipientId: "user-a",
      }),
    ).toBeNull();
    expect(
      mapFriendRequestDocument("id", {
        requesterId: "user-a",
        recipientId: "user-b",
        status: "accepted",
      })?.status,
    ).toBe("pending");
  });
});

describe("mapFriendshipDocument", () => {
  it("maps a stored friendship", () => {
    expect(
      mapFriendshipDocument("user-a__user-b", {
        memberIds: ["user-a", "user-b"],
        requesterId: "user-b",
        recipientId: "user-a",
        createdAt: "2026-11-14T10:00:00.000Z",
      }),
    ).toEqual({
      id: "user-a__user-b",
      memberIds: ["user-a", "user-b"],
      requesterId: "user-b",
      recipientId: "user-a",
      createdAt: "2026-11-14T10:00:00.000Z",
    });
  });

  it("rebuilds missing members and falls back to the member order", () => {
    const friendship = mapFriendshipDocument("user-a__user-b", {
      requesterId: "user-a",
      recipientId: "user-b",
      memberIds: ["user-b", "user-a"],
    });

    expect(friendship?.memberIds).toEqual(["user-a", "user-b"]);
    expect(friendship?.requesterId).toBe("user-a");
    expect(friendship?.recipientId).toBe("user-b");

    const legacy = mapFriendshipDocument("user-a__user-b", {
      requesterId: "user-a",
      recipientId: "user-b",
    });

    expect(legacy?.memberIds).toEqual(["user-a", "user-b"]);
  });

  it("drops friendships without a usable pair", () => {
    expect(mapFriendshipDocument("id", {})).toBeNull();
    expect(
      mapFriendshipDocument("id", {
        memberIds: ["user-a", "user-a"],
        requesterId: "user-a",
        recipientId: "user-a",
      }),
    ).toBeNull();
  });
});
