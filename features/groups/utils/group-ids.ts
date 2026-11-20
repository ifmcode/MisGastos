/**
 * Separator shared by the owner-namespaced group id, the deterministic
 * invitation id and the friend pair id.
 */
export const GROUP_ID_SEPARATOR = "__";

function readIdPart(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Group document id: `${ownerId}__${autoId}`. The owner prefix is a security
 * boundary: `firestore.rules` only lets a caller create a group (and therefore
 * an invitation) under their own namespace, without reading the group.
 */
export function createGroupDocumentId(
  ownerId: unknown,
  autoId: unknown,
): string {
  const owner = readIdPart(ownerId);
  const random = readIdPart(autoId);

  if (owner.length === 0 || random.length === 0) return "";

  return `${owner}${GROUP_ID_SEPARATOR}${random}`;
}

/** Mirrors `isOwnedGroupId` in `firestore.rules`, so a bad id is dropped. */
export function groupIdBelongsToOwner(
  groupId: unknown,
  ownerId: unknown,
): boolean {
  const owner = readIdPart(ownerId);
  if (owner.length === 0) return false;

  const group = readIdPart(groupId);
  const prefix = `${owner}${GROUP_ID_SEPARATOR}`;

  // The auto id after the separator must exist, like in the rules.
  return group.length > prefix.length && group.startsWith(prefix);
}

/**
 * Deterministic invitation id: `groupId__inviteeId`, where the group id itself
 * starts with the owner uid. One document per invitee and group, so re-inviting
 * reopens it and a duplicate create is impossible.
 */
export function createGroupInvitationId(
  groupId: unknown,
  inviteeId: unknown,
): string {
  const group = readIdPart(groupId);
  const invitee = readIdPart(inviteeId);

  if (group.length === 0 || invitee.length === 0) return "";

  return `${group}${GROUP_ID_SEPARATOR}${invitee}`;
}
