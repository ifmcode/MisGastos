import type { INotificationsRepository } from "@/features/notifications/repositories/notifications.repository";

import {
  buildGroupInviteNotification,
  buildGroupJoinOutcomeNotification,
  buildGroupJoinRequestNotification,
  type GroupInviteNotificationInput,
  type GroupJoinOutcomeNotificationInput,
  type GroupJoinRequestNotificationInput,
  type IGroupNotificationPort,
} from "./group-notification.port";

/**
 * Writes the in-app group notifications through the notifications repository,
 * so the inbox keeps one stored shape and one dedupe rule.
 */
export class FirebaseGroupNotificationPort implements IGroupNotificationPort {
  constructor(private readonly notifications: INotificationsRepository) {}

  async notifyGroupInvite(input: GroupInviteNotificationInput): Promise<void> {
    await this.notifications.createNotification(
      buildGroupInviteNotification(input),
    );
  }

  async notifyJoinRequest(
    input: GroupJoinRequestNotificationInput,
  ): Promise<void> {
    await this.notifications.createNotification(
      buildGroupJoinRequestNotification(input),
    );
  }

  async notifyJoinOutcome(
    input: GroupJoinOutcomeNotificationInput,
  ): Promise<void> {
    await this.notifications.createNotification(
      buildGroupJoinOutcomeNotification(input),
    );
  }
}
