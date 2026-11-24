import { toLocalIsoDate } from "@/shared/utils/date";

import type { GroupActivity } from "../types/group-activity.types";
import type { GroupMember } from "../types/group.types";
import {
  resolveGroupActivitySettlementPair,
  resolveGroupMemberName,
} from "./group-activity-participants";
import type {
  GroupActivityDestination,
  GroupActivityDisplay,
  GroupActivityDisplayOptions,
} from "./group-activity-display.types";

export type {
  GroupActivityDestination,
  GroupActivityDisplay,
  GroupActivityDisplayOptions,
} from "./group-activity-display.types";
export { resolveGroupMemberName } from "./group-activity-participants";

function readText(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Uid of the affected member. An ownership transfer falls back to the new
 * owner, which is the subject the feed names next to the previous owner.
 */
function resolveTargetUid(activity: GroupActivity): string {
  if (activity.type === "owner-transferred") {
    return readText(activity.targetUserId) || readText(activity.newOwnerId);
  }

  return readText(activity.targetUserId);
}

function resolveTargetName(
  activity: GroupActivity,
  members: readonly GroupMember[],
  targetUid: string,
): string | null {
  const fromMembers = resolveGroupMemberName(members, targetUid);
  if (fromMembers) return fromMembers;

  const snapshot = readText(activity.targetName);
  return snapshot.length > 0 ? snapshot : null;
}

/** Pure mapper from one event to its display descriptor. */
export function getGroupActivityDisplay(
  activity: GroupActivity,
  { members, viewerUid, viewerName, unknownMember }: GroupActivityDisplayOptions,
): GroupActivityDisplay {
  const actorUid = readText(activity.actorId);
  const targetUid = resolveTargetUid(activity);
  const viewer = readText(viewerUid);
  const pair = resolveGroupActivitySettlementPair(activity, {
    members,
    viewerUid,
    viewerName,
    unknownMember,
  });
  const isMemberAddition =
    activity.type === "member-joined" &&
    targetUid.length > 0 &&
    targetUid !== actorUid;

  return {
    key: activity.id,
    type: activity.type,
    actorName: resolveGroupMemberName(members, actorUid),
    targetName: resolveTargetName(activity, members, targetUid),
    fromName: pair.fromName,
    toName: pair.toName,
    isMemberAddition,
    isViewerActor: actorUid.length > 0 && actorUid === viewer,
    isViewerTarget: targetUid.length > 0 && targetUid === viewer,
    amountCents: activity.amountCents,
    currency: activity.currency,
    description: readText(activity.description) || null,
    changedFields: [...activity.changedFields],
    simplifyDebts: activity.simplifyDebts,
    expenseId: readText(activity.expenseId) || null,
    settlementId: readText(activity.settlementId) || null,
    createdAt: activity.createdAt,
  };
}

/** Maps one service page to display descriptors, preserving its order. */
export function getGroupActivityDisplays(
  activities: readonly GroupActivity[],
  options: GroupActivityDisplayOptions,
): GroupActivityDisplay[] {
  return activities.map((activity) =>
    getGroupActivityDisplay(activity, options),
  );
}

/**
 * Local calendar date of the event for the row gutter. `createdAt` is a full
 * timestamp, while the shared formatter reads `YYYY-MM-DD`; an unparseable value
 * is returned untouched so the row still renders something.
 */
export function getGroupActivityDate(activity: GroupActivityDisplay): string {
  const date = new Date(activity.createdAt);
  if (Number.isNaN(date.getTime())) return activity.createdAt;

  return toLocalIsoDate(date) ?? activity.createdAt;
}

/** Active expense and settlement events open their detail; deletions do not. */
export function getGroupActivityDestination(
  activity: GroupActivityDisplay,
): GroupActivityDestination | null {
  if (
    activity.type === "expense-deleted" ||
    activity.type === "settlement-deleted"
  ) {
    return null;
  }

  if (activity.type.startsWith("expense-") && activity.expenseId) {
    return { kind: "expense", expenseId: activity.expenseId };
  }

  if (activity.type.startsWith("settlement-") && activity.settlementId) {
    return { kind: "settlement", settlementId: activity.settlementId };
  }

  return null;
}
