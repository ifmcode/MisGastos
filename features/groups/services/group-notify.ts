import type {
  IGroupNotificationPort,
} from "../repositories/group-notification.port";
import {
  toGroupInviteNotificationInput,
} from "../repositories/group-notification.port";
import type {
  GroupJoinOutcomeNotificationInput,
  GroupJoinRequestNotificationInput,
} from "../repositories/group-notification.port";
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

/** One best-effort write to the owner; a failure never fails the request. */
export async function notifyGroupJoinRequest(
  port: IGroupNotificationPort,
  input: GroupJoinRequestNotificationInput,
): Promise<void> {
  try {
    await port.notifyJoinRequest(input);
  } catch {
    // The group detail shows the pending request even without a notification.
  }
}

/** One best-effort outcome write to the requester. */
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
