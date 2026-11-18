import type { AppNotification } from "../types/notification.types";

export type NotificationTarget =
  | { kind: "settlement"; settlementId: string; friendUid: string | null }
  | { kind: "expense"; expenseId: string; friendUid: string | null }
  | { kind: "requests" }
  | { kind: "friend"; friendUid: string };

function readPayloadId(
  notification: AppNotification,
  key: string,
): string | null {
  const value = notification.payload[key];

  if (typeof value !== "string") return null;

  const id = value.trim();
  return id.length > 0 ? id : null;
}

function readExpenseId(notification: AppNotification): string | null {
  return (
    readPayloadId(notification, "expenseId") ??
    readPayloadId(notification, "sharedExpenseId")
  );
}

/**
 * Where a notification opens, derived from `type` + payload so the row and the
 * banner cannot drift. A settlement event opens its detail; group events open
 * the shared expense; requests and accepted requests open their lists. A legacy
 * or unknown type falls back by payload, and a target without ids returns null.
 */
export function resolveNotificationTarget(
  notification: AppNotification,
): NotificationTarget | null {
  const friendUid = readPayloadId(notification, "friendUid");

  if (notification.type.startsWith("settlement-")) {
    const settlementId = readPayloadId(notification, "settlementId");
    if (settlementId) return { kind: "settlement", settlementId, friendUid };
  }

  if (notification.type === "friend-request") return { kind: "requests" };

  if (notification.type === "friend-request-accepted") {
    return friendUid ? { kind: "friend", friendUid } : null;
  }

  if (
    notification.type === "group-expense" ||
    notification.type === "group-settlement"
  ) {
    const expenseId = readExpenseId(notification);
    if (expenseId) return { kind: "expense", expenseId, friendUid };
  }

  const settlementId = readPayloadId(notification, "settlementId");
  if (settlementId) return { kind: "settlement", settlementId, friendUid };

  const expenseId = readExpenseId(notification);
  if (expenseId) return { kind: "expense", expenseId, friendUid };

  return friendUid ? { kind: "friend", friendUid } : null;
}

function withFriend(href: string, friendUid: string | null): string {
  return friendUid ? `${href}&friendUid=${encodeURIComponent(friendUid)}` : href;
}

/**
 * Plain href of a target. Nested details carry `from=notification`, so their
 * back action lands on the friend detail instead of the inbox.
 */
export function buildNotificationTargetHref(
  target: NotificationTarget,
): string {
  switch (target.kind) {
    case "settlement":
      return withFriend(
        `/social/settlements/${encodeURIComponent(target.settlementId)}?from=notification`,
        target.friendUid,
      );
    case "expense":
      return withFriend(
        `/social/expenses/${encodeURIComponent(target.expenseId)}?from=notification`,
        target.friendUid,
      );
    case "requests":
      return "/social/requests";
    case "friend":
      return `/social/friends/${encodeURIComponent(target.friendUid)}`;
  }
}
