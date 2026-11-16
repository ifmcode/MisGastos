import { describe, expect, it } from "@jest/globals";

import type { Friend } from "../../types/friend.types";
import { findFriendByUid, getFriendDetailHeader } from "../friend-detail";

function buildFriend(overrides: Partial<Friend> = {}): Friend {
  return {
    uid: "friend-1",
    displayName: "Ana",
    email: "ana@example.com",
    balances: [],
    since: "2026-11-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("findFriendByUid", () => {
  it("returns the friend matching the trimmed uid", () => {
    const friend = buildFriend();

    expect(findFriendByUid([buildFriend({ uid: "other" }), friend], " friend-1 "))
      .toBe(friend);
  });

  it("returns null for an unknown uid", () => {
    expect(findFriendByUid([buildFriend()], "friend-2")).toBeNull();
  });

  it("returns null for an empty uid without scanning", () => {
    expect(findFriendByUid([buildFriend()], "")).toBeNull();
    expect(findFriendByUid([buildFriend()], "   ")).toBeNull();
  });

  it("returns null when the overview has no friends", () => {
    expect(findFriendByUid([], "friend-1")).toBeNull();
  });
});

describe("getFriendDetailHeader", () => {
  it("uses the display name and trims the email", () => {
    const header = getFriendDetailHeader(
      buildFriend({ displayName: " Ana ", email: " ana@example.com " }),
    );

    expect(header.uid).toBe("friend-1");
    expect(header.name).toBe("Ana");
    expect(header.email).toBe("ana@example.com");
    expect(header.since).toBe("2026-11-01T10:00:00.000Z");
  });

  it("falls back to the email when the display name is missing", () => {
    const header = getFriendDetailHeader(
      buildFriend({ displayName: null, email: "ana@example.com" }),
    );

    expect(header.name).toBe("ana@example.com");
  });

  it("falls back to the uid when there is no name or email", () => {
    const header = getFriendDetailHeader(
      buildFriend({ displayName: "  ", email: "  " }),
    );

    expect(header.name).toBe("friend-1");
    expect(header.email).toBe("");
  });

  it("passes an empty since date through", () => {
    expect(getFriendDetailHeader(buildFriend({ since: "" })).since).toBe("");
  });

  it("keeps one sized line per currency and never sums them", () => {
    const header = getFriendDetailHeader(
      buildFriend({
        balances: [
          { currency: "EUR", netBalanceCents: 1250 },
          { currency: "USD", netBalanceCents: -300 },
        ],
      }),
    );

    expect(header.balances).toEqual([
      { currency: "EUR", amount: 12.5, direction: "friend-owes-viewer" },
      { currency: "USD", amount: 3, direction: "viewer-owes-friend" },
    ]);
  });

  it("drops currencies whose net is zero", () => {
    const header = getFriendDetailHeader(
      buildFriend({
        balances: [
          { currency: "EUR", netBalanceCents: 0 },
          { currency: "GBP", netBalanceCents: -450 },
        ],
      }),
    );

    expect(header.balances).toEqual([
      { currency: "GBP", amount: 4.5, direction: "viewer-owes-friend" },
    ]);
  });

  it("returns no balance lines when the pair is settled", () => {
    expect(getFriendDetailHeader(buildFriend()).balances).toEqual([]);
  });
});
