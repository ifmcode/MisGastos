import type { INotificationsRepository } from "@/features/notifications/repositories/notifications.repository";

import {
  buildGroupInviteNotification,
  type GroupInviteNotificationInput,
  type IGroupNotificationPort,
} from "./group-notification.port";

/**
 * Writes the in-app `group-invite` notification through the notifications
 * repository, so the inbox keeps one stored shape and one dedupe rule.
 */
export class FirebaseGroupNotificationPort implements IGroupNotificationPort {
  constructor(private readonly notifications: INotificationsRepository) {}

  async notifyGroupInvite(input: GroupInviteNotificationInput): Promise<void> {
    await this.notifications.createNotification(
      buildGroupInviteNotification(input),
    );
  }
}
