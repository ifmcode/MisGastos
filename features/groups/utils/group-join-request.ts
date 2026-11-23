import type { Group } from "../types/group.types";
import type {
  GroupJoinRequest,
  GroupJoinRequestItem,
  OwnerJoinRequestItem,
} from "../types/group-join.types";

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

/**
 * Cross-group order of the Social owner queue: oldest first, then group id and
 * request id, so two groups answered in the same second never swap places.
 */
export function compareOwnerJoinRequests(
  left: OwnerJoinRequestItem,
  right: OwnerJoinRequestItem,
): number {
  if (left.item.request.createdAt !== right.item.request.createdAt) {
    return left.item.request.createdAt < right.item.request.createdAt ? -1 : 1;
  }
  if (left.groupId !== right.groupId) {
    return left.groupId < right.groupId ? -1 : 1;
  }
  if (left.item.request.id === right.item.request.id) return 0;

  return left.item.request.id < right.item.request.id ? -1 : 1;
}

/**
 * Flattens the per-group queues the owner read into one deterministic list.
 * Groups missing from the map are skipped; the inputs are never mutated.
 */
export function buildOwnerJoinRequests(
  groups: readonly Pick<Group, "id" | "name">[],
  itemsByGroup: ReadonlyMap<string, readonly GroupJoinRequestItem[]>,
): OwnerJoinRequestItem[] {
  const rows = groups.flatMap((group) => {
    const items = itemsByGroup.get(group.id);
    if (!items) return [];

    return items.map((item) => ({
      groupId: group.id,
      groupName: group.name,
      item,
    }));
  });

  return rows.sort(compareOwnerJoinRequests);
}
