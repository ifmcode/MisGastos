import {
  collection,
  doc,
  getDoc,
  getDocs,
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

  const notifications: AppNotification[] = [];

  for (const document of snapshot.docs) {
    const notification = mapNotificationDocument(
      document.id,
      document.data() as Record<string, unknown>,
    );
    if (notification) notifications.push(notification);
  }

  return notifications;
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

export async function markNotificationReadOperation(
  notificationId: string,
  readAt: string,
): Promise<void> {
  await updateDoc(notificationRef(notificationId), { readAt });
}
