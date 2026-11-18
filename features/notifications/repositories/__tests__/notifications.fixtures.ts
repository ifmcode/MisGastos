import type { AppNotification } from "../../types/notification.types";

/** Valid notification; override only what the assertion needs. */
export function buildNotification(
  overrides: Partial<AppNotification> = {},
): AppNotification {
  return {
    id: "settlement-1:created:user-b",
    userId: "user-b",
    type: "settlement-created",
    payload: {
      settlementId: "settlement-1",
      pairId: "user-a__user-b",
      friendUid: "user-a",
      amountCents: 1000,
      currency: "EUR",
      isFull: false,
      canLinkWallet: true,
    },
    createdAt: "2026-11-16T10:00:00.000Z",
    seenAt: null,
    readAt: null,
    dedupeKey: "settlement-1:created:user-b",
    ...overrides,
  };
}

/** Valid `notifications` document payload; the id is the dedupe key. */
export function buildNotificationDocument(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const notification = buildNotification();

  return {
    userId: notification.userId,
    type: notification.type,
    payload: notification.payload,
    createdAt: notification.createdAt,
    seenAt: notification.seenAt,
    readAt: notification.readAt,
    dedupeKey: notification.dedupeKey,
    ...overrides,
  };
}

/** Drops `seenAt` to simulate a TICKET-046 document (no migration). */
export function buildLegacyNotificationDocument(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const document = buildNotificationDocument(overrides);
  delete document.seenAt;

  return document;
}
