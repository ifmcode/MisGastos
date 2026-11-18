import type { Friend } from "@/features/friends/types/friend.types";

import type { AppNotification } from "../../types/notification.types";
import type { NotificationRowContext } from "../notification-rows";

export const friends: Friend[] = [
  {
    uid: "user-a",
    displayName: "Ana",
    email: "ana@example.com",
    balances: [],
    since: "2026-01-01",
  },
];

/** Settlement notification of the row tests; override what the case needs. */
export function buildNotification(
  overrides: Partial<AppNotification> = {},
): AppNotification {
  return {
    id: "notification-1",
    userId: "user-b",
    type: "settlement-created",
    payload: {
      settlementId: "settlement-1",
      pairId: "user-a__user-b",
      friendUid: "user-a",
      amountCents: 1250,
      currency: "EUR",
      isFull: true,
      canLinkWallet: false,
    },
    createdAt: "2026-11-17T10:00:00.000Z",
    seenAt: null,
    readAt: null,
    dedupeKey: "settlement-1:created:user-b",
    ...overrides,
  };
}

/** Row context resolving the actor from the friends list, as the inbox does. */
export const rowContext: NotificationRowContext = {
  friends,
  formatCurrency: (value: number) => `${value.toFixed(2)} €`,
  formatRelativeDate: () => "hace 1 hora",
  t: (key: string, options?: Record<string, unknown>) =>
    options ? `${key}:${JSON.stringify(options)}` : key,
};
