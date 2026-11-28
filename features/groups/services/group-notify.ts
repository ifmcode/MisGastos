import type {
  GroupJoinOutcomeNotificationInput,
  IGroupNotificationPort,
} from "../repositories/group-notification.port";

/**
 * Only results are notified: a pending invitation or join request is an
 * actionable card of its own screen, so writing a notification for it would
 * duplicate the badge. The write is best-effort and a failure never fails the
 * business operation, which is already committed.
 */
export async function notifyGroupJoinOutcome(
  port: IGroupNotificationPort,
  input: GroupJoinOutcomeNotificationInput,
): Promise<void> {
  try {
    await port.notifyJoinOutcome(input);
  } catch {
    // The requester still sees the group or the rejection on the next refresh.
  }
}
