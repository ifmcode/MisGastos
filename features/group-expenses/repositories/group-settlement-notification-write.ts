import { getDoc, setDoc } from "firebase/firestore";

import type { NotificationWrite } from "@/features/notifications/types/notification.types";
import {
  createNotificationDocumentId,
  toNotificationData,
} from "@/features/notifications/repositories/notifications.data";
import { notificationRef } from "@/features/notifications/repositories/notifications.operations";

/**
 * Writes the counterpart notification **after** the money transaction commits
 * and swallows every failure: the decision for group settlements is that a
 * notification can never roll back the settlement, the creditor income or the
 * wallet balance. The deterministic `dedupeKey` keeps a retried event from
 * duplicating the row, and the group detail is the fallback surface.
 */
export async function writeGroupSettlementNotification(
  input: NotificationWrite,
): Promise<void> {
  try {
    const documentId = createNotificationDocumentId(input.dedupeKey);
    const reference = notificationRef(documentId);
    const snapshot = await getDoc(reference);

    if (snapshot.exists()) return;

    await setDoc(reference, toNotificationData(input));
  } catch {
    // Best effort: the group detail shows the settlement without the inbox row.
  }
}
