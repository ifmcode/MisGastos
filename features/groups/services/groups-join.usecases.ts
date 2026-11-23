import type { Group } from "../types/group.types";
import type {
  GroupJoinLookup,
  GroupJoinRequest,
  GroupJoinRequestItem,
  OwnerJoinRequestItem,
} from "../types/group-join.types";
import { buildOwnerJoinRequests } from "../utils/group-join-request";
import type { GroupWriteDeps } from "./group-deps";
import { loadGroupJoinRequestItems } from "./group-detail";
import { requireGroupViewer } from "./group-guards";
import {
  ensureGroupJoinCode,
  lookupGroupJoinCode,
  requestToJoinGroup,
  respondToGroupJoinRequest,
} from "./group-join";

/**
 * Join-code use cases in their own class so `groups.service.ts` keeps the
 * invitation/membership surface and both files stay under the size limit.
 */
export class GroupsJoinUseCases {
  protected constructor(protected readonly writeDeps: GroupWriteDeps) {}

  async lookupJoinCode(
    viewerUid: string,
    rawCode: string,
  ): Promise<GroupJoinLookup> {
    const viewer = requireGroupViewer(viewerUid);

    return lookupGroupJoinCode(this.writeDeps.repository, viewer, rawCode);
  }

  async requestToJoin(
    viewerUid: string,
    rawCode: string,
  ): Promise<GroupJoinRequest> {
    const viewer = requireGroupViewer(viewerUid);

    return requestToJoinGroup(this.writeDeps, viewer, rawCode);
  }

  /**
   * Every pending join request of the viewer's own groups, oldest first.
   * `groupJoinRequests` has no denormalized owner, so the queue fans out one
   * read per owned group (at most 20); the accepted V1 read budget.
   */
  async getOwnerJoinRequests(
    viewerUid: string,
  ): Promise<OwnerJoinRequestItem[]> {
    const viewer = requireGroupViewer(viewerUid);
    const groups = await this.writeDeps.repository.getGroups(viewer);
    const ownedGroups = groups.filter((group) => group.ownerId === viewer);
    if (ownedGroups.length === 0) return [];

    const itemsByGroup = new Map<string, readonly GroupJoinRequestItem[]>();
    await Promise.all(
      ownedGroups.map(async (group) => {
        itemsByGroup.set(
          group.id,
          await loadGroupJoinRequestItems(
            this.writeDeps.repository,
            this.writeDeps.friendsRepository,
            group,
          ),
        );
      }),
    );

    return buildOwnerJoinRequests(ownedGroups, itemsByGroup);
  }

  async respondToJoinRequest(
    viewerUid: string,
    groupId: string,
    requestId: string,
    decision: "accepted" | "rejected",
  ): Promise<{ group: Group; request: GroupJoinRequest }> {
    const viewer = requireGroupViewer(viewerUid);

    return respondToGroupJoinRequest(
      this.writeDeps,
      viewer,
      groupId,
      requestId,
      decision,
    );
  }

  async ensureJoinCode(viewerUid: string, groupId: string): Promise<string> {
    const viewer = requireGroupViewer(viewerUid);

    return ensureGroupJoinCode(this.writeDeps.repository, viewer, groupId);
  }
}
