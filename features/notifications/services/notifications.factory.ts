import { FirebaseNotificationsRepository } from "../repositories/firebase-notifications.repository";
import { NotificationsService } from "./notifications.service";

let notificationsServiceInstance: NotificationsService | null = null;

export function getNotificationsService(): NotificationsService {
  if (!notificationsServiceInstance) {
    notificationsServiceInstance = new NotificationsService(
      new FirebaseNotificationsRepository(),
    );
  }

  return notificationsServiceInstance;
}
