import { describe, expect, it, jest } from "@jest/globals";

import type { Friend, Friendship } from "../../types/friend.types";
import { buildFriendsOverview, compareFriends } from "../friend-overview";

const createdAt = "2026-11-14T10:00:00.000Z";

function friend(overrides: Partial<Friend> = {}): Friend {
  return {
    uid: "user-b",
    displayName: "Ada",
    email: "b@example.com",
    balances: [],
    since: createdAt,
    ...overrides,
  };
}

function friendship(
  memberIds: [string, string],
): Friendship {
  return {
    id: `${memberIds[0]}__${memberIds[1]}`,
    memberIds,
    requesterId: memberIds[0],
    recipientId: memberIds[1],
    createdAt,
  };
}

describe("compareFriends", () => {
  it("compares names with the fixed en collation", () => {
    const spy = jest.spyOn(String.prototype, "localeCompare");

    let result = 0;
    let args: unknown[][] = [];
    try {
      result = compareFriends(friend(), friend({ uid: "user-c" }));
      args = spy.mock.calls.map((call) => call.slice(1));
    } finally {
      spy.mockRestore();
    }

    expect(result).toBe("user-b".localeCompare("user-c"));
    expect(args).toContainEqual(["en", { sensitivity: "base" }]);
  });

  it("is case insensitive and breaks ties by uid", () => {
    const lower = friend({ uid: "user-c", displayName: "ada" });
    const upper = friend({ uid: "user-b", displayName: "Ada" });

    expect(compareFriends(upper, lower)).toBeLessThan(0);
    expect(compareFriends(lower, upper)).toBeGreaterThan(0);
  });

  it("sorts friends by email when the profile has no display name", () => {
    const overview = buildFriendsOverview({
      viewerUid: "user-a",
      friendships: [
        friendship(["user-a", "user-b"]),
        friendship(["user-a", "user-c"]),
      ],
      requests: [],
      profiles: [
        { uid: "user-b", displayName: null, email: "zoe@example.com" },
        { uid: "user-c", displayName: " ", email: "ada@example.com" },
      ],
      ledgerEntries: [],
    });

    expect(overview.friends.map((item) => item.uid)).toEqual([
      "user-c",
      "user-b",
    ]);
  });
});
