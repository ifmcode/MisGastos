import type { GroupMember } from "@/features/groups/types/group.types";

export interface GroupMemberNameOptions {
  /** Viewer of the form: their own row always reads with the viewer label. */
  viewerUid: string;
  viewerLabel: string;
  fallback: string;
}

/**
 * Display name of a group member. The viewer reads with the viewer label, then
 * the stored display name, then the email and finally a translated fallback, so
 * a member without a profile name never renders a blank row.
 */
export function getGroupMemberName(
  members: readonly GroupMember[],
  uid: string,
  options: GroupMemberNameOptions,
): string {
  const id = typeof uid === "string" ? uid.trim() : "";
  if (id.length === 0) return options.fallback;

  if (id === options.viewerUid.trim()) return options.viewerLabel;

  const member = members.find((item) => item.uid.trim() === id);
  const displayName = member?.displayName?.trim() ?? "";
  if (displayName.length > 0) return displayName;

  const email = member?.email?.trim() ?? "";
  return email.length > 0 ? email : options.fallback;
}

/** Member uids in the order the group document lists them, trimmed and unique. */
export function getGroupMemberIds(members: readonly GroupMember[]): string[] {
  const ids: string[] = [];

  for (const member of members) {
    const id = member.uid.trim();
    if (id.length > 0 && !ids.includes(id)) ids.push(id);
  }

  return ids;
}
