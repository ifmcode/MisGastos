import { describe, expect, it } from "@jest/globals";

import type { FriendRequest, Friendship } from "../../types/friend.types";
import {
  findPendingRequest,
  resolveFriendRelation,
} from "../friend-relation";

const friendship: Friendship = {
  id: "user-a__user-b",
  memberIds: ["user-a", "user-b"],
  requesterId: "user-a",
  recipientId: "user-b",
  createdAt: "2026-11-14T10:00:00.000Z",
};

function request(overrides: Partial<FriendRequest> = {}): FriendRequest {
  return {
    id: "user-a__user-c",
    requesterId: "user-a",
    recipientId: "user-c",
    participantIds: ["user-a", "user-c"],
    status: "pending",
    createdAt: "2026-11-14T10:00:00.000Z",
    updatedAt: "2026-11-14T10:00:00.000Z",
    ...overrides,
  };
}

describe("findPendingRequest", () => {
  it("finds the pending request of a pair in any direction", () => {
    const requests = [request()];

    expect(findPendingRequest(requests, "user-c", "user-a")?.id).toBe(
      "user-a__user-c",
    );
    expect(findPendingRequest(requests, "user-a", "user-b")).toBeNull();
  });

  it("ignores requests that are not pending", () => {
    expect(
      findPendingRequest([request({ status: "rejected" })], "user-a", "user-c"),
    ).toBeNull();
  });
});

describe("resolveFriendRelation", () => {
  it("resolves self, friend, outgoing, incoming and none", () => {
    expect(
      resolveFriendRelation("user-a", "user-a", {
        friendships: [],
        requests: [],
      }),
    ).toEqual({ relation: "self", requestId: null });

    expect(
      resolveFriendRelation("user-a", "user-b", {
        friendships: [friendship],
        requests: [],
      }),
    ).toEqual({ relation: "friend", requestId: null });

    expect(
      resolveFriendRelation("user-a", "user-c", {
        friendships: [],
        requests: [request()],
      }),
    ).toEqual({ relation: "outgoing", requestId: "user-a__user-c" });

    expect(
      resolveFriendRelation("user-c", "user-a", {
        friendships: [],
        requests: [request()],
      }),
    ).toEqual({ relation: "incoming", requestId: "user-a__user-c" });

    expect(
      resolveFriendRelation("user-d", "user-a", {
        friendships: [],
        requests: [request()],
      }),
    ).toEqual({ relation: "none", requestId: null });
  });

  it("returns none for empty ids", () => {
    const context = { friendships: [], requests: [] };

    expect(resolveFriendRelation("", "user-a", context).relation).toBe("none");
    expect(resolveFriendRelation("user-a", "", context).relation).toBe("none");
  });

  it("returns none when the request has an inconsistent sender", () => {
    const inconsistent = request({
      requesterId: "user-x",
      recipientId: "user-y",
      participantIds: ["user-x", "user-y"],
    });

    expect(
      resolveFriendRelation("user-a", "user-c", {
        friendships: [],
        requests: [inconsistent],
      }),
    ).toEqual({ relation: "none", requestId: null });
  });
});
