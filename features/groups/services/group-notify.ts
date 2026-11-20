import type { IGroupNotificationPort } from "../repositories/group-notification.port";
import { toGroupInviteNotificationInput } from "../repositories/group-notification.port";
import type { GroupInvitation } from "../types/group.types";

/**
 * Best-effort notification fan-out: one create per invitation, and a failure
 * is swallowed because the invitations screen is the fallback. The group and
 * its invitations are already committed before this runs.
 */
export async function notifyGroupInvitations(
  port: IGroupNotificationPort,
  invitations: readonly GroupInvitation[],
): Promise<void> {
  if (invitations.length === 0) return;

  await Promise.allSettled(
    invitations.map((invitation) =>
      port.notifyGroupInvite(toGroupInviteNotificationInput(invitation)),
    ),
  );
}
