import { describe, expect, it } from "@jest/globals";

import type { GroupJoinLookup } from "../../types/group-join.types";
import {
  applyGroupJoinErrorToLookup,
  resolveGroupJoinView,
} from "../group-join-view";

function lookup(
  overrides: Partial<GroupJoinLookup> = {},
): GroupJoinLookup {
  return {
    code: "ABCD2345",
    groupId: "user-a__g1",
    ownerId: "user-a",
    groupName: "Trip to Rome",
    membership: "none",
    requestStatus: null,
    ...overrides,
  };
}

describe("resolveGroupJoinView", () => {
  it("starts in the form state without a lookup", () => {
    expect(resolveGroupJoinView({ lookup: null, sent: false })).toEqual({
      kind: "form",
      lookup: null,
    });
  });

  it("goes back to the form when the code is invalid", () => {
    const view = resolveGroupJoinView({
      lookup: lookup(),
      sent: false,
      errorCode: "INVALID_JOIN_CODE",
    });

    expect(view).toEqual({ kind: "form", lookup: null });
  });

  it("shows the found group when the viewer can request to join", () => {
    const found = lookup();

    expect(resolveGroupJoinView({ lookup: found, sent: false })).toEqual({
      kind: "found",
      lookup: found,
    });
  });

  it("treats a cancelled request as requestable again", () => {
    const cancelled = lookup({ requestStatus: "cancelled" });

    expect(resolveGroupJoinView({ lookup: cancelled, sent: false }).kind).toBe(
      "found",
    );
  });

  it("shows the member state when membership already exists", () => {
    const member = lookup({ membership: "member" });

    expect(resolveGroupJoinView({ lookup: member, sent: false }).kind).toBe(
      "member",
    );
  });

  it("shows the member state for an accepted request", () => {
    const accepted = lookup({ requestStatus: "accepted" });

    expect(resolveGroupJoinView({ lookup: accepted, sent: false }).kind).toBe(
      "member",
    );
  });

  it("shows a pending request", () => {
    const pending = lookup({ requestStatus: "pending" });

    expect(resolveGroupJoinView({ lookup: pending, sent: false }).kind).toBe(
      "pending",
    );
  });

  it("shows a rejected request", () => {
    const rejected = lookup({ requestStatus: "rejected" });

    expect(resolveGroupJoinView({ lookup: rejected, sent: false }).kind).toBe(
      "rejected",
    );
  });

  it("prefers the sent state right after sending", () => {
    const sent = lookup();

    expect(resolveGroupJoinView({ lookup: sent, sent: true })).toEqual({
      kind: "sent",
      lookup: sent,
    });
  });

  it("ignores sent without a lookup", () => {
    expect(resolveGroupJoinView({ lookup: null, sent: true }).kind).toBe(
      "form",
    );
  });

  it("keeps the current state on a network error", () => {
    const found = lookup();

    expect(
      resolveGroupJoinView({
        lookup: found,
        sent: false,
        errorCode: "NETWORK",
      }).kind,
    ).toBe("found");
  });
});

describe("applyGroupJoinErrorToLookup", () => {
  it("returns null without a lookup", () => {
    expect(applyGroupJoinErrorToLookup(null, "ALREADY_MEMBER")).toBeNull();
  });

  it("moves the lookup to the member state when membership exists", () => {
    const updated = applyGroupJoinErrorToLookup(lookup(), "ALREADY_MEMBER");

    expect(updated?.membership).toBe("member");
    expect(updated?.requestStatus).toBeNull();
  });

  it("moves the lookup to pending when a request already exists", () => {
    const updated = applyGroupJoinErrorToLookup(
      lookup(),
      "JOIN_REQUEST_ALREADY_PENDING",
    );

    expect(updated?.requestStatus).toBe("pending");
  });

  it("keeps the same lookup for an unrelated error", () => {
    const current = lookup();

    expect(applyGroupJoinErrorToLookup(current, "NETWORK")).toBe(current);
  });
});
