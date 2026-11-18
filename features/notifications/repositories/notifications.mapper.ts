import { toIsoTimestamp } from "@/shared/utils/date";

import type {
  AppNotification,
  NotificationPayload,
} from "../types/notification.types";
import { isNotificationType } from "../utils/notifications.utils";

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readPayload(value: unknown): NotificationPayload | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as NotificationPayload;
}

/**
 * Converts a `notifications` document. Malformed records return null instead of
 * breaking the inbox: an unknown type, a missing owner, a non-map payload or an
 * unparseable creation stamp is dropped.
 */
export function mapNotificationDocument(
  id: string,
  data: Record<string, unknown>,
): AppNotification | null {
  const notificationId = readText(id);
  if (notificationId.length === 0) return null;

  const userId = readText(data.userId);
  if (userId.length === 0) return null;

  if (!isNotificationType(data.type)) return null;

  const payload = readPayload(data.payload);
  if (payload === null) return null;

  const createdAt = toIsoTimestamp(data.createdAt);
  if (createdAt === null) return null;

  const readAt = readText(data.readAt);
  const dedupeKey = readText(data.dedupeKey);

  return {
    id: notificationId,
    userId,
    type: data.type,
    payload,
    createdAt,
    readAt: readAt.length > 0 ? readAt : null,
    dedupeKey: dedupeKey.length > 0 ? dedupeKey : notificationId,
  };
}
