import { describe, expect, it } from "@jest/globals";

import type { NotificationTarget } from "../notifications.utils";
import { buildNotificationTargetHref } from "../notifications.utils";

describe("buildNotificationTargetHref", () => {
  it("builds the settlement href with the friend fallback", () => {
    expect(
      buildNotificationTargetHref({
        kind: "settlement",
        settlementId: "settlement-1",
        friendUid: "user-a",
      }),
    ).toBe("/social/settlements/settlement-1?friendUid=user-a");

    expect(
      buildNotificationTargetHref({
        kind: "settlement",
        settlementId: "settlement-1",
        friendUid: null,
      }),
    ).toBe("/social/settlements/settlement-1");
  });

  it("builds the expense href and encodes every id", () => {
    expect(
      buildNotificationTargetHref({
        kind: "expense",
        expenseId: "expense/1",
        friendUid: "user a",
      }),
    ).toBe("/social/expenses/expense%2F1?friendUid=user%20a");
  });

  it("builds the group href and encodes the id", () => {
    expect(
      buildNotificationTargetHref({ kind: "group", groupId: "user-a__g/1" }),
    ).toBe("/social/groups/user-a__g%2F1");
  });

  it("builds the group settlement href and encodes the id", () => {
    expect(
      buildNotificationTargetHref({
        kind: "groupSettlement",
        settlementId: "group/settlement-1",
      }),
    ).toBe("/social/group-settlements/group%2Fsettlement-1");
  });

  it("builds the requests and friend hrefs", () => {
    expect(buildNotificationTargetHref({ kind: "requests" })).toBe(
      "/social/requests",
    );

    const friendTarget: NotificationTarget = {
      kind: "friend",
      friendUid: "user/a",
    };
    expect(buildNotificationTargetHref(friendTarget)).toBe(
      "/social/friends/user%2Fa",
    );
  });
});
