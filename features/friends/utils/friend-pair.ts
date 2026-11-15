/** Separator of the deterministic pair document id. */
export const FRIEND_PAIR_SEPARATOR = "__";

function readUid(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Returns the two uids sorted lexicographically, which is the order used by
 * `firestore.rules` (`memberIds[0] < memberIds[1]`). Invalid pairs (empty or
 * repeated uids) return an empty array so callers can reject them.
 */
export function getFriendPairMemberIds(
  uidA: unknown,
  uidB: unknown,
): string[] {
  const first = readUid(uidA);
  const second = readUid(uidB);

  if (first.length === 0 || second.length === 0 || first === second) {
    return [];
  }

  return first < second ? [first, second] : [second, first];
}

/**
 * Deterministic id shared by a friendship and its request:
 * `participantIds[0] + "__" + participantIds[1]`. Both clients compute the same
 * id, so one document exists per pair and no lookup query is needed.
 */
export function createFriendPairId(uidA: unknown, uidB: unknown): string {
  const memberIds = getFriendPairMemberIds(uidA, uidB);
  if (memberIds.length !== 2) return "";

  return `${memberIds[0]}${FRIEND_PAIR_SEPARATOR}${memberIds[1]}`;
}

export function isValidFriendPair(value: unknown): value is string[] {
  if (!Array.isArray(value) || value.length !== 2) return false;

  const first: unknown = value[0];
  const second: unknown = value[1];
  if (typeof first !== "string" || typeof second !== "string") return false;

  const trimmedFirst = first.trim();
  const trimmedSecond = second.trim();

  return (
    trimmedFirst.length > 0 &&
    trimmedSecond.length > 0 &&
    trimmedFirst < trimmedSecond
  );
}

/** Returns the member of a two-uid pair that is not `memberId`. */
export function getOtherMemberId(
  memberIds: readonly string[],
  memberId: unknown,
): string | null {
  const viewer = readUid(memberId);
  if (viewer.length === 0 || memberIds.length !== 2) return null;
  if (!memberIds.includes(viewer)) return null;

  return memberIds[0] === viewer ? memberIds[1] : memberIds[0];
}
