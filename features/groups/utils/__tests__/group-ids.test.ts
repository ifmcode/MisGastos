import { describe, expect, it } from "@jest/globals";

import {
  createGroupDocumentId,
  createGroupInvitationId,
  groupIdBelongsToOwner,
} from "../group-ids";

describe("createGroupDocumentId", () => {
  it("namespaces the auto id with the owner uid", () => {
    expect(createGroupDocumentId("user-a", "abc123")).toBe("user-a__abc123");
    expect(createGroupDocumentId(" user-a ", " abc123 ")).toBe(
      "user-a__abc123",
    );
  });

  it("refuses a missing owner or auto id", () => {
    expect(createGroupDocumentId("", "abc123")).toBe("");
    expect(createGroupDocumentId("user-a", "")).toBe("");
  });
});

describe("groupIdBelongsToOwner", () => {
  it("accepts only the owner namespace", () => {
    expect(groupIdBelongsToOwner("user-a__abc123", "user-a")).toBe(true);
    expect(groupIdBelongsToOwner("user-b__abc123", "user-a")).toBe(false);
    expect(groupIdBelongsToOwner("abc123", "user-a")).toBe(false);
    expect(groupIdBelongsToOwner("user-a_abc123", "user-a")).toBe(false);
    expect(groupIdBelongsToOwner("user-a__", "user-a")).toBe(false);
    expect(groupIdBelongsToOwner("user-a__abc123", "")).toBe(false);
    expect(groupIdBelongsToOwner(42, "user-a")).toBe(false);
  });
});

describe("createGroupInvitationId", () => {
  it("appends the invitee to the owner-namespaced group id", () => {
    expect(createGroupInvitationId("user-a__group-1", "user-b")).toBe(
      "user-a__group-1__user-b",
    );
    expect(createGroupInvitationId("", "user-b")).toBe("");
    expect(createGroupInvitationId("user-a__group-1", "  ")).toBe("");
  });
});
