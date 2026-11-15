import { describe, expect, it } from "@jest/globals";

import type {
  FriendRequest,
  Friendship,
} from "../../types/friend.types";
import {
  buildFriendsOverview,
  collectOverviewProfileIds,
} from "../friend-overview";

const createdAt = "2026-11-14T10:00:00.000Z";

function friendship(
  id: string,
  memberIds: string[],
): Friendship {
  return {
    id,
    memberIds,
    requesterId: memberIds[0] ?? "",
    recipientId: memberIds[1] ?? "",
    createdAt,
  };
}

function request(
  id: string,
  participantIds: string[],
  requesterId: string,
): FriendRequest {
  return {
    id,
    requesterId,
    recipientId: participantIds.find((uid) => uid !== requesterId) ?? "",
    participantIds,
    status: "pending",
    createdAt,
    updatedAt: createdAt,
  };
}

function build(overrides: Partial<Parameters<typeof buildFriendsOverview>[0]>) {
  return {
    viewerUid: "user-a",
    friendships: [],
    requests: [],
    profiles: [],
    ledgerEntries: [],
    ...overrides,
  };
}

describe("buildFriendsOverview", () => {
  it("dedupes friendships and breaks name ties by uid", () => {
    const overview = buildFriendsOverview(
      build({
        friendships: [
          friendship("pair-1", ["user-a", "user-c"]),
          friendship("pair-2", ["user-a", "user-b"]),
          friendship("pair-3", ["user-a", "user-b"]),
        ],
        profiles: [
          { uid: "user-b", displayName: "Ada", email: "b@example.com" },
          { uid: "user-c", displayName: "Ada", email: "c@example.com" },
        ],
      }),
    );

    expect(overview.friends.map((friend) => friend.uid)).toEqual([
      "user-b",
      "user-c",
    ]);
  });

  it("breaks request date ties by request id", () => {
    const overview = buildFriendsOverview(
      build({
        requests: [
          request("user-a__user-c", ["user-a", "user-c"], "user-a"),
          request("user-a__user-b", ["user-a", "user-b"], "user-a"),
        ],
      }),
    );

    expect(overview.outgoing.map((item) => item.requestId)).toEqual([
      "user-a__user-b",
      "user-a__user-c",
    ]);
  });

  it("drops rows whose participant pair is unusable", () => {
    const overview = buildFriendsOverview(
      build({
        friendships: [friendship("pair-1", ["user-a"])],
        requests: [request("pair-2", ["user-b"], "user-b")],
      }),
    );

    expect(overview).toEqual({ friends: [], incoming: [], outgoing: [] });
  });
});

describe("collectOverviewProfileIds", () => {
  it("returns each peer once and skips unusable pairs", () => {
    const ids = collectOverviewProfileIds(
      "user-a",
      [
        friendship("pair-1", ["user-a", "user-b"]),
        friendship("pair-2", ["user-a"]),
      ],
      [
        request("user-a__user-b", ["user-a", "user-b"], "user-b"),
        request("user-a__user-c", ["user-a", "user-c"], "user-a"),
        { ...request("user-a__user-d", ["user-a", "user-d"], "user-a"), status: "rejected" },
      ],
    );

    expect(ids).toEqual(["user-b", "user-c"]);
  });
});
