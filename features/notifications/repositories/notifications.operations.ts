import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import type {
  AppNotification,
  NotificationWrite,
} from "../types/notification.types";
import {
  createNotificationDocumentId,
  toNotificationData,
} from "./notifications.data";
import { mapNotificationDocument } from "./notifications.mapper";
import type {
  NotificationsListener,
  NotificationsListenerError,
  NotificationsUnsubscribe,
} from "./notifications.repository";

export const NOTIFICATIONS_COLLECTION = "notifications";

export function notificationRef(notificationId: string) {
  return doc(db, NOTIFICATIONS_COLLECTION, notificationId);
}

export async function getNotificationOperation(
  notificationId: string,
): Promise<AppNotification | null> {
  const snapshot = await getDoc(notificationRef(notificationId));
  if (!snapshot.exists()) return null;

  return mapNotificationDocument(
    snapshot.id,
    snapshot.data() as Record<string, unknown>,
  );
}

/** Equality filter on the owner; no composite index is required. */
export async function getNotificationsOperation(
  userId: string,
): Promise<AppNotification[]> {
  const snapshot = await getDocs(
    query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("userId", "==", userId),
    ),
  );

  return mapNotificationDocuments(snapshot.docs);
}

/** Shared by the one-shot read and the foreground listener. */
function mapNotificationDocuments(
  documents: ReadonlyArray<{
    id: string;
    data: () => unknown;
  }>,
): AppNotification[] {
  const notifications: AppNotification[] = [];

  for (const document of documents) {
    const notification = mapNotificationDocument(
      document.id,
      document.data() as Record<string, unknown>,
    );
    if (notification) notifications.push(notification);
  }

  return notifications;
}

/**
 * Foreground listener over the same owner-scoped query as the inbox. The
 * banner uses it; the inbox stays the source of truth. Returns the
 * `unsubscribe` function so the hook can clean up on blur/unmount.
 */
export function listenNotificationsOperation(
  userId: string,
  onChange: NotificationsListener,
  onError?: NotificationsListenerError,
): NotificationsUnsubscribe {
  return onSnapshot(
    query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("userId", "==", userId),
    ),
    (snapshot) => {
      onChange(mapNotificationDocuments(snapshot.docs));
    },
    onError ? (error) => onError(error) : undefined,
  );
}

/**
 * Idempotent write: the deterministic id is read first, so a retried event
 * returns `null` instead of duplicating the notification.
 */
export async function createNotificationOperation(
  input: NotificationWrite,
): Promise<AppNotification | null> {
  const documentId = createNotificationDocumentId(input.dedupeKey);
  const reference = notificationRef(documentId);
  const snapshot = await getDoc(reference);

  if (snapshot.exists()) return null;

  const data = toNotificationData(input);
  await setDoc(reference, data);

  return mapNotificationDocument(documentId, data);
}

/** Presented but not opened: only `seenAt` changes, `readAt` stays unread. */
export async function markNotificationSeenOperation(
  notificationId: string,
  seenAt: string,
): Promise<void> {
  await updateDoc(notificationRef(notificationId), { seenAt });
}

/**
 * Opening writes both stamps in ONE update: `readAt` (opened) and `seenAt`
 * (presented). The rules allow only these two mutable fields.
 */
export async function markNotificationReadOperation(
  notificationId: string,
  readAt: string,
  seenAt: string,
): Promise<void> {
  await updateDoc(notificationRef(notificationId), { readAt, seenAt });
}
