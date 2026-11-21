import type { GroupJoinLookup } from "../types/group-join.types";

/**
 * Visual state of `/social/groups/join`. It is derived, never stored, so the
 * code form, the lookup result and a sent request cannot drift apart.
 */
export type GroupJoinViewKind =
  | "form"
  | "found"
  | "member"
  | "pending"
  | "rejected"
  | "sent";

export interface GroupJoinView {
  kind: GroupJoinViewKind;
  /** Null only in the `form` state. */
  lookup: GroupJoinLookup | null;
}

export interface GroupJoinViewInput {
  lookup: GroupJoinLookup | null;
  sent: boolean;
  /** Latest mapped service code, if any. */
  errorCode?: string | null;
}

/**
 * `INVALID_JOIN_CODE` never wins a stale result: it sends the viewer back to the
 * form with the field error. An accepted request is a membership, a cancelled
 * one can be requested again, and a resolved status always beats lookup order.
 */
export function resolveGroupJoinView({
  lookup,
  sent,
  errorCode = null,
}: GroupJoinViewInput): GroupJoinView {
  if (!lookup || errorCode === "INVALID_JOIN_CODE") {
    return { kind: "form", lookup: null };
  }

  if (sent) return { kind: "sent", lookup };
  if (lookup.membership === "member") return { kind: "member", lookup };

  switch (lookup.requestStatus) {
    case "pending":
      return { kind: "pending", lookup };
    case "accepted":
      return { kind: "member", lookup };
    case "rejected":
      return { kind: "rejected", lookup };
    default:
      return { kind: "found", lookup };
  }
}

/**
 * Codes that only mean the server state moved since the lookup. They switch the
 * card to the true state instead of showing a banner; anything else still is
 * an error and keeps the current view.
 */
export function applyGroupJoinErrorToLookup(
  lookup: GroupJoinLookup | null,
  errorCode: string,
): GroupJoinLookup | null {
  if (!lookup) return null;
  if (errorCode === "ALREADY_MEMBER") {
    return { ...lookup, membership: "member" };
  }
  if (errorCode === "JOIN_REQUEST_ALREADY_PENDING") {
    return { ...lookup, requestStatus: "pending" };
  }

  return lookup;
}
