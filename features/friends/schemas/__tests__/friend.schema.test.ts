import { describe, expect, it } from "@jest/globals";

import {
  FRIEND_DISPLAY_NAME_MAX_LENGTH,
  normalizeFriendEmail,
  toFriendFieldErrors,
  validateFriendEmail,
  validateFriendViewerId,
  validatePublicProfileInput,
  validateSendFriendRequestInput,
} from "../friend.schema";

describe("normalizeFriendEmail", () => {
  it("trims and lowercases the email", () => {
    expect(normalizeFriendEmail("  Ada@Example.COM ")).toBe("ada@example.com");
  });

  it("returns an empty string for non-string values", () => {
    expect(normalizeFriendEmail(null)).toBe("");
    expect(normalizeFriendEmail(42)).toBe("");
  });
});

describe("validateFriendEmail", () => {
  it("returns the normalized email", () => {
    expect(validateFriendEmail(" Ada@Example.com ")).toEqual({
      ok: true,
      value: "ada@example.com",
    });
  });

  it("reports a required email", () => {
    expect(validateFriendEmail("   ")).toEqual({
      ok: false,
      error: [{ field: "email", code: "EMAIL_REQUIRED" }],
    });
  });

  it("reports an invalid email", () => {
    expect(validateFriendEmail("ada.example.com")).toEqual({
      ok: false,
      error: [{ field: "email", code: "EMAIL_INVALID" }],
    });
  });

  it("reports an email that is too long", () => {
    const email = `${"a".repeat(250)}@b.co`;

    expect(validateFriendEmail(email)).toEqual({
      ok: false,
      error: [{ field: "email", code: "EMAIL_TOO_LONG" }],
    });
  });
});

describe("validateFriendViewerId", () => {
  it("trims the uid", () => {
    expect(validateFriendViewerId("  user-1 ")).toEqual({
      ok: true,
      value: "user-1",
    });
  });

  it("rejects an empty uid", () => {
    expect(validateFriendViewerId("  ")).toEqual({
      ok: false,
      error: [{ field: "uid", code: "UID_REQUIRED" }],
    });
  });
});

describe("validateSendFriendRequestInput", () => {
  it("returns the pair sorted and trimmed", () => {
    expect(
      validateSendFriendRequestInput({
        requesterId: " user-b ",
        recipientId: " user-a ",
      }),
    ).toEqual({
      ok: true,
      value: {
        requesterId: "user-b",
        recipientId: "user-a",
        participantIds: ["user-a", "user-b"],
      },
    });
  });

  it("requires both uids", () => {
    expect(
      validateSendFriendRequestInput({ requesterId: " ", recipientId: "" }),
    ).toEqual({
      ok: false,
      error: [
        { field: "requesterId", code: "REQUESTER_REQUIRED" },
        { field: "recipientId", code: "RECIPIENT_REQUIRED" },
      ],
    });
  });

  it("rejects a request to the same user", () => {
    expect(
      validateSendFriendRequestInput({
        requesterId: "user-a",
        recipientId: "user-a",
      }),
    ).toEqual({
      ok: false,
      error: [{ field: "recipientId", code: "SAME_USER" }],
    });
  });
});

describe("validatePublicProfileInput", () => {
  it("normalizes the email and trims the display name", () => {
    expect(
      validatePublicProfileInput({
        uid: " user-1 ",
        displayName: "  Ada Lovelace ",
        email: " ADA@example.com ",
      }),
    ).toEqual({
      ok: true,
      value: {
        uid: "user-1",
        displayName: "Ada Lovelace",
        email: "ada@example.com",
      },
    });
  });

  it("accepts a missing display name", () => {
    expect(
      validatePublicProfileInput({
        uid: "user-1",
        displayName: "   ",
        email: "ada@example.com",
      }),
    ).toEqual({
      ok: true,
      value: { uid: "user-1", displayName: null, email: "ada@example.com" },
    });
  });

  it("collects every issue", () => {
    expect(
      validatePublicProfileInput({
        uid: " ",
        displayName: "a".repeat(FRIEND_DISPLAY_NAME_MAX_LENGTH + 1),
        email: "invalid",
      }),
    ).toEqual({
      ok: false,
      error: [
        { field: "uid", code: "UID_REQUIRED" },
        { field: "email", code: "EMAIL_INVALID" },
        { field: "displayName", code: "DISPLAY_NAME_TOO_LONG" },
      ],
    });
  });
});

describe("toFriendFieldErrors", () => {
  it("keeps the first code of each field", () => {
    expect(
      toFriendFieldErrors([
        { field: "email", code: "EMAIL_REQUIRED" },
        { field: "email", code: "EMAIL_INVALID" },
        { field: "uid", code: "UID_REQUIRED" },
      ]),
    ).toEqual({ email: "EMAIL_REQUIRED", uid: "UID_REQUIRED" });
  });
});
