import type { GroupActivity } from "../types/group-activity.types";
import type { GroupMember } from "../types/group.types";

function readText(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Display name of one member: profile name first, then the email, otherwise
 * `null`. The viewer is not special-cased here; the caller owns the "you" copy.
 */
export function resolveGroupMemberName(
  members: readonly GroupMember[],
  uid: string | null | undefined,
): string | null {
  const id = readText(uid);
  if (id.length === 0) return null;

  const member = members.find((item) => readText(item.uid) === id);
  if (!member) return null;

  const displayName = readText(member.displayName);
  if (displayName.length > 0) return displayName;

  const email = readText(member.email);
  return email.length > 0 ? email : null;
}

export interface SettlementPairOptions {
  members: readonly GroupMember[];
  viewerUid: string;
  /** Translated "you" label, used when the viewer is one side of the pair. */
  viewerName: string;
  /** Translated fallback for a uid that is no longer a member. */
  unknownMember: string;
}

export interface GroupActivitySettlementPair {
  fromName: string | null;
  toName: string | null;
}

function resolvePairName(
  uid: string | null,
  { members, viewerUid, viewerName, unknownMember }: SettlementPairOptions,
): string | null {
  const id = readText(uid);
  if (id.length === 0) return null;

  if (id === readText(viewerUid)) return viewerName;

  return resolveGroupMemberName(members, id) ?? unknownMember;
}

/**
 * Who paid whom on a settlement event (`fromUserId` pays `toUserId`). Every
 * other type returns a null pair, so the row never shows a settlement line on
 * expenses or membership changes.
 */
export function resolveGroupActivitySettlementPair(
  activity: GroupActivity,
  options: SettlementPairOptions,
): GroupActivitySettlementPair {
  if (!activity.type.startsWith("settlement-")) {
    return { fromName: null, toName: null };
  }

  return {
    fromName: resolvePairName(activity.fromUserId, options),
    toName: resolvePairName(activity.toUserId, options),
  };
}
