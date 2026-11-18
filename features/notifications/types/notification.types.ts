import type { CurrencyCode } from "@/shared/constants/currencies";

/** Events TICKET-046 emits; the rules only allow these three types. */
export type SettlementNotificationEvent = "created" | "updated" | "deleted";

export type SettlementNotificationType =
  | "settlement-created"
  | "settlement-updated"
  | "settlement-deleted";

export const SETTLEMENT_NOTIFICATION_TYPES: readonly SettlementNotificationType[] =
  ["settlement-created", "settlement-updated", "settlement-deleted"];

/**
 * Reserved for TICKET-047 (friend requests, groups). The union keeps the type
 * open for new events without touching the settlement payload.
 */
export type NotificationType = SettlementNotificationType;

/**
 * Ids and numbers only: the copy is resolved by the UI from `type` + payload,
 * so services never store a sentence and the notification survives a locale
 * change.
 */
export interface SettlementNotificationPayload {
  settlementId: string;
  pairId: string;
  /** The actor, i.e. the recipient's friend in this event. */
  friendUid: string;
  amountCents: number;
  currency: CurrencyCode;
  isFull: boolean;
  canLinkWallet: boolean;
}

export type NotificationPayload = Record<string, unknown>;

/** `notifications/{dedupeKey}` document, readable only by its recipient. */
export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  payload: NotificationPayload;
  createdAt: string;
  readAt: string | null;
  dedupeKey: string;
}

/** Write payload; the document id is derived from `dedupeKey`. */
export interface NotificationWrite {
  userId: string;
  type: NotificationType;
  payload: NotificationPayload;
  dedupeKey: string;
  createdAt: string;
}
