import { describe, expect, it } from "@jest/globals";

import {
  getFriendDisplayName,
  getFriendRelationNoteKey,
} from "../friend-display";

describe("getFriendDisplayName", () => {
  it("prefers the trimmed display name", () => {
    expect(
      getFriendDisplayName({
        uid: "user-a",
        displayName: "  Ana ",
        email: "ana@example.com",
      }),
    ).toBe("Ana");
  });

  it("falls back to the email when the display name is missing or blank", () => {
    expect(
      getFriendDisplayName({
        uid: "user-a",
        displayName: null,
        email: " ana@example.com ",
      }),
    ).toBe("ana@example.com");
    expect(
      getFriendDisplayName({
        uid: "user-a",
        displayName: "   ",
        email: "ana@example.com",
      }),
    ).toBe("ana@example.com");
  });

  it("falls back to the uid when there is no public profile", () => {
    expect(
      getFriendDisplayName({ uid: "user-a", displayName: null, email: "" }),
    ).toBe("user-a");
    expect(
      getFriendDisplayName({ uid: "user-a", displayName: "  ", email: " " }),
    ).toBe("user-a");
  });
});

describe("getFriendRelationNoteKey", () => {
  it("maps every non-actionable relation to its copy key", () => {
    expect(getFriendRelationNoteKey("outgoing")).toBe("search.relationOutgoing");
    expect(getFriendRelationNoteKey("incoming")).toBe("search.relationIncoming");
    expect(getFriendRelationNoteKey("friend")).toBe("search.relationFriend");
    expect(getFriendRelationNoteKey("self")).toBe("search.relationSelf");
  });
});
