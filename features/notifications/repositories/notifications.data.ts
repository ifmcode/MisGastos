import type { NotificationWrite } from "../types/notification.types";

const DEDUPE_KEY_MAX_LENGTH = 900;
const FALLBACK_DEDUPE_KEY = "notification";

/**
 * Firestore ids cannot contain `/`, and the rules require
 * `notificationId == dedupeKey`, so both values use this normalized form.
 */
export function sanitizeDedupeKey(dedupeKey: string): string {
  const normalized = dedupeKey
    .trim()
    .replace(/\//g, "_")
    .slice(0, DEDUPE_KEY_MAX_LENGTH);

  return normalized.length > 0 ? normalized : FALLBACK_DEDUPE_KEY;
}

/**
 * Deterministic document id: a retried write resolves to the same document, so
 * the create operation can skip it instead of duplicating the notification.
 */
export function createNotificationDocumentId(dedupeKey: string): string {
  return sanitizeDedupeKey(dedupeKey);
}

/**
 * Full document of a new notification. `undefined` never reaches Firestore.
 * Creation starts Pendiente and unread (`seenAt`/`readAt` null); the owner
 * stamps them later, so the rules only accept null on create.
 */
export function toNotificationData(
  input: NotificationWrite,
): Record<string, unknown> {
  return {
    userId: input.userId,
    type: input.type,
    payload: input.payload,
    createdAt: input.createdAt,
    seenAt: null,
    readAt: null,
    dedupeKey: createNotificationDocumentId(input.dedupeKey),
  };
}
