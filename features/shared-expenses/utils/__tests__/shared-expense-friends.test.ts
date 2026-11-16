import { describe, expect, it } from "@jest/globals";

import type { Friend } from "@/features/friends/types/friend.types";

import { getSharedExpenseParticipantName } from "../shared-expense-friends";

function buildFriend(overrides: Partial<Friend> = {}): Friend {
  return {
    uid: "user-b",
    displayName: "Bea",
    email: "bea@example.com",
    balances: [],
    since: "2026-11-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("getSharedExpenseParticipantName", () => {
  it("prefers the display name of an accepted friend", () => {
    expect(
      getSharedExpenseParticipantName([buildFriend()], "user-b", "Amigo"),
    ).toBe("Bea");
  });

  it("falls back to the email when there is no display name", () => {
    expect(
      getSharedExpenseParticipantName(
        [buildFriend({ displayName: null })],
        "user-b",
        "Amigo",
      ),
    ).toBe("bea@example.com");
  });

  it("uses the generic label for removed or unknown friends", () => {
    expect(getSharedExpenseParticipantName([], "user-b", "Amigo")).toBe(
      "Amigo",
    );
    expect(
      getSharedExpenseParticipantName([buildFriend()], "user-z", "Amigo"),
    ).toBe("Amigo");
  });
});
