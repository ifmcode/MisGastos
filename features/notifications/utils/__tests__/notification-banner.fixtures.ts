import type { AppNotification } from "../../types/notification.types";
import type { NotificationRowContext } from "../notification-rows";

/** Notification fixture of the banner tests; override what the case needs. */
export function buildNotification(
  id: string,
  overrides: Partial<AppNotification> = {},
): AppNotification {
  return {
    id,
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
    dedupeKey: `${id}:created:user-b`,
    ...overrides,
  };
}

/** Row context with the actor already resolved, as the banner passes it. */
export const bannerContext: NotificationRowContext = {
  friends: [],
  actorName: "Ana",
  formatCurrency: (value: number) => `${value.toFixed(2)} €`,
  formatRelativeDate: () => "hace 1 minuto",
  t: (key: string, options?: Record<string, unknown>) =>
    options ? `${key}:${JSON.stringify(options)}` : key,
};
