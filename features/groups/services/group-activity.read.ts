import type { IGroupsRepository } from "../repositories/groups.repository";
import type {
  GroupActivityPage,
  GroupActivityQuery,
} from "../types/group-activity.types";
import { clampGroupActivityLimit } from "../utils/group-activity";
import { assertGroupMember, requireGroup } from "./group-guards";

/**
 * Member-only history read: a non-member or a missing group fails with its
 * stable code instead of leaking an empty feed. The page size is clamped here
 * (default 20, max 50) and malformed rows are dropped by the repository mapper,
 * so the UI only receives trustworthy events.
 */
export async function loadGroupActivity(
  repository: IGroupsRepository,
  viewerUid: string,
  groupId: string,
  query: GroupActivityQuery = {},
): Promise<GroupActivityPage> {
  const group = await requireGroup(repository, groupId);
  assertGroupMember(group, viewerUid);

  return repository.getGroupActivity(group.id, {
    limit: clampGroupActivityLimit(query.limit),
    after: query.after ?? null,
  });
}
