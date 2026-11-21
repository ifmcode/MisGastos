import type { GroupJoinRequest } from "../types/group-join.types";

export function filterPendingJoinRequests(
  requests: readonly GroupJoinRequest[],
): GroupJoinRequest[] {
  return requests.filter((request) => request.status === "pending");
}

/**
 * A requester can enter through an invitation while their code request is still
 * pending. The row would only ever fail with `ALREADY_MEMBER`, so the owner
 * queue hides it; the document stays pending as the audit trail.
 */
export function filterJoinRequestsOfNonMembers(
  requests: readonly GroupJoinRequest[],
  memberIds: readonly string[],
): GroupJoinRequest[] {
  return requests.filter((request) => !memberIds.includes(request.requesterId));
}

/** Oldest first, id ascending as tie-breaker: the owner queue never jumps. */
export function compareJoinRequestsOldestFirst(
  left: GroupJoinRequest,
  right: GroupJoinRequest,
): number {
  if (left.createdAt !== right.createdAt) {
    return left.createdAt < right.createdAt ? -1 : 1;
  }
  if (left.id === right.id) return 0;

  return left.id < right.id ? -1 : 1;
}

export function sortJoinRequestsOldestFirst(
  requests: readonly GroupJoinRequest[],
): GroupJoinRequest[] {
  return [...requests].sort(compareJoinRequestsOldestFirst);
}
