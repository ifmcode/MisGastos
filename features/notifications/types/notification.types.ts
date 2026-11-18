import type { CurrencyCode } from "@/shared/constants/currencies";

/** Events TICKET-046 emits; the rules only allow these three types on create. */
export type SettlementNotificationEvent = "created" | "updated" | "deleted";

export type SettlementNotificationType =
  | "settlement-created"
  | "settlement-updated"
  | "settlement-deleted";

export const SETTLEMENT_NOTIFICATION_TYPES: readonly SettlementNotificationType[] =
  ["settlement-created", "settlement-updated", "settlement-deleted"];

/**
 * Reserved by TICKET-047 for friend requests and group expenses. They are
 * read-compatible with the settlement shape (same document fields, no extra
 * payload contract) so the inbox can map and navigate them, but the rules still
 * reject them on create: no producer exists yet. Enabling a producer only needs
 * a payload contract and a rules entry, never a second collection.
 */
export type ReservedNotificationType =
  | "friend-request"
  | "friend-request-accepted"
  | "group-expense"
  | "group-settlement";

export const RESERVED_NOTIFICATION_TYPES: readonly ReservedNotificationType[] = [
  "friend-request",
  "friend-request-accepted",
  "group-expense",
  "group-settlement",
];

export type NotificationType =
  | SettlementNotificationType
  | ReservedNotificationType;

/** Every readable type; the mapper accepts this union and nothing else. */
export const NOTIFICATION_TYPES: readonly NotificationType[] = [
  ...SETTLEMENT_NOTIFICATION_TYPES,
  ...RESERVED_NOTIFICATION_TYPES,
];

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

/**
 * `notifications/{dedupeKey}` document, readable only by its recipient.
 *
 * Two independent stamps:
 * - `seenAt` (first presented) drives the inbox segments: `null` = Pendiente,
 *   a value = Vista. A dismissed or timed-out banner only writes this one.
 * - `readAt` (opened) drives the unread marker: `null` = unread, in either
 *   segment. Opening writes both stamps in a single update.
 *
 * A legacy document without `seenAt` maps to `null`, so it is Pendiente and no
 * migration is needed.
 */
export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  payload: NotificationPayload;
  createdAt: string;
  seenAt: string | null;
  readAt: string | null;
  dedupeKey: string;
}

/**
 * Write payload; the document id is derived from `dedupeKey`. Creation always
 * stores `seenAt: null` and `readAt: null` (see `toNotificationData`), so a new
 * notification is both Pendiente and unread until the owner interacts with it.
 */
export interface NotificationWrite {
  userId: string;
  type: NotificationType;
  payload: NotificationPayload;
  dedupeKey: string;
  createdAt: string;
}

/**
 * Producer contract for future non-settlement writers (friend requests,
 * groups). It is the same write DTO on purpose: one stored shape, one
 * `dedupeKey` idempotency rule, one rules entry per producer.
 */
export type NotificationEventInput = NotificationWrite;
