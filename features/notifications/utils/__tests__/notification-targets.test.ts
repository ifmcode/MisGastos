import { describe, expect, it } from "@jest/globals";

import { buildNotification } from "../../repositories/__tests__/notifications.fixtures";
import { resolveNotificationTarget } from "../notifications.utils";

describe("resolveNotificationTarget", () => {
  it("opens the settlement detail for a settlement event", () => {
    expect(resolveNotificationTarget(buildNotification())).toEqual({
      kind: "settlement",
      settlementId: "settlement-1",
      friendUid: "user-a",
    });
  });

  it("falls back to the friend when a settlement id is missing", () => {
    expect(
      resolveNotificationTarget(
        buildNotification({
          payload: { settlementId: "  ", friendUid: "user-a" },
        }),
      ),
    ).toEqual({ kind: "friend", friendUid: "user-a" });
  });

  it("opens the shared expense for group types", () => {
    expect(
      resolveNotificationTarget(
        buildNotification({
          type: "group-expense",
          payload: { expenseId: "expense-1", friendUid: "user-a" },
        }),
      ),
    ).toEqual({ kind: "expense", expenseId: "expense-1", friendUid: "user-a" });

    expect(
      resolveNotificationTarget(
        buildNotification({
          type: "group-settlement",
          payload: { sharedExpenseId: "expense-2" },
        }),
      ),
    ).toEqual({
      kind: "expense",
      expenseId: "expense-2",
      friendUid: null,
    });
  });

  it("falls back to the friend for a group type without an expense id", () => {
    expect(
      resolveNotificationTarget(
        buildNotification({
          type: "group-expense",
          payload: { friendUid: "user-a" },
        }),
      ),
    ).toEqual({ kind: "friend", friendUid: "user-a" });
  });

  it("opens the requests list for a friend request", () => {
    expect(
      resolveNotificationTarget(
        buildNotification({
          type: "friend-request",
          payload: { friendUid: "user-a" },
        }),
      ),
    ).toEqual({ kind: "requests" });
  });

  it("opens the requests list for a group invite", () => {
    expect(
      resolveNotificationTarget(
        buildNotification({
          type: "group-invite",
          payload: {
            invitationId: "group-1__user-b",
            groupId: "group-1",
            groupName: "Viaje",
            friendUid: "user-a",
          },
        }),
      ),
    ).toEqual({ kind: "requests" });
  });

  it("opens the friend detail for an accepted request", () => {
    expect(
      resolveNotificationTarget(
        buildNotification({
          type: "friend-request-accepted",
          payload: { friendUid: "user-a" },
        }),
      ),
    ).toEqual({ kind: "friend", friendUid: "user-a" });

    expect(
      resolveNotificationTarget(
        buildNotification({
          type: "friend-request-accepted",
          payload: {},
        }),
      ),
    ).toBeNull();
  });

  it("resolves a legacy or unknown type by its payload", () => {
    expect(
      resolveNotificationTarget(
        buildNotification({
          type: "legacy-event" as never,
          payload: { settlementId: "settlement-9" },
        }),
      ),
    ).toEqual({
      kind: "settlement",
      settlementId: "settlement-9",
      friendUid: null,
    });

    expect(
      resolveNotificationTarget(
        buildNotification({
          type: "legacy-event" as never,
          payload: { expenseId: "expense-9" },
        }),
      ),
    ).toEqual({ kind: "expense", expenseId: "expense-9", friendUid: null });

    expect(
      resolveNotificationTarget(
        buildNotification({
          type: "legacy-event" as never,
          payload: { friendUid: "user-a" },
        }),
      ),
    ).toEqual({ kind: "friend", friendUid: "user-a" });

    expect(
      resolveNotificationTarget(
        buildNotification({
          type: "legacy-event" as never,
          payload: { friendUid: 42 },
        }),
      ),
    ).toBeNull();
  });
});
