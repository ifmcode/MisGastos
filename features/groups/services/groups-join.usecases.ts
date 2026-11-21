import type { Group } from "../types/group.types";
import type {
  GroupJoinLookup,
  GroupJoinRequest,
  GroupJoinRequestItem,
} from "../types/group-join.types";
import type { GroupWriteDeps } from "./group-deps";
import { loadGroupJoinRequestItems } from "./group-detail";
import { assertGroupOwner, requireGroup, requireGroupViewer } from "./group-guards";
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

  /** Owner-only pending queue; the detail read already includes it. */
  async getJoinRequests(
    viewerUid: string,
    groupId: string,
  ): Promise<GroupJoinRequestItem[]> {
    const viewer = requireGroupViewer(viewerUid);
    const group = await requireGroup(this.writeDeps.repository, groupId);
    assertGroupOwner(group, viewer);

    return loadGroupJoinRequestItems(
      this.writeDeps.repository,
      this.writeDeps.friendsRepository,
      group,
    );
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
