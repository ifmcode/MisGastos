import { readCurrentOwnerId } from "@/shared/lib/local-db/current-owner";
import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

import type {
  Group,
  GroupInvitation,
} from "../types/group.types";
import type {
  GroupActivityPage,
  GroupActivityQuery,
} from "../types/group-activity.types";
import type {
  GroupCode,
  GroupJoinRequest,
} from "../types/group-join.types";
import { CachedGroupsWrites } from "./cached-groups.writes";
import type { IGroupsRepository } from "./groups.repository";
import {
  cacheGroupInvitations,
  cacheGroups,
  cachePendingInvitations,
  readCachedGroup,
  readCachedGroupInvitations,
  readCachedGroups,
  readCachedPendingInvitations,
} from "./local-groups.cache";

/**
 * Read-through groups: the list, one group and its invitations survive an
 * offline launch. Group management stays in `CachedGroupsWrites` (online only).
 */
export class CachedGroupsRepository
  extends CachedGroupsWrites
  implements IGroupsRepository
{
  constructor(remote: IGroupsRepository) {
    super(remote);
  }

  async getGroups(memberId: string): Promise<Group[]> {
    try {
      const groups = await this.remote.getGroups(memberId);
      await this.bestEffort(() =>
        cacheGroups(memberId, groups, new Date().toISOString()),
      );
      return groups;
    } catch (error) {
      const cached = await readCachedGroups(memberId);
      if (cached) return cached;
      throw error;
    }
  }

  async getGroup(groupId: string): Promise<Group | null> {
    try {
      const group = await this.remote.getGroup(groupId);
      if (group) {
        await this.mirrorGroup(group);
        return group;
      }

      const ownerId = readCurrentOwnerId();
      return ownerId ? readCachedGroup(ownerId, groupId) : null;
    } catch (error) {
      const ownerId = readCurrentOwnerId();
      const cached = ownerId ? await readCachedGroup(ownerId, groupId) : null;
      if (cached) return cached;
      throw error;
    }
  }

  getGroupActivity(
    groupId: string,
    query?: GroupActivityQuery,
  ): Promise<GroupActivityPage> {
    return this.remote.getGroupActivity(groupId, query);
  }

  getGroupInvitation(invitationId: string): Promise<GroupInvitation | null> {
    return this.remote.getGroupInvitation(invitationId);
  }

  async getGroupInvitations(groupId: string): Promise<GroupInvitation[]> {
    try {
      const invitations = await this.remote.getGroupInvitations(groupId);
      await this.cacheInvitationList(groupId, invitations);
      return invitations;
    } catch (error) {
      const ownerId = readCurrentOwnerId();
      const cached = ownerId
        ? await readCachedGroupInvitations(ownerId, groupId)
        : null;
      if (cached) return cached;
      if (isOfflineFirstEnabled()) return [];
      throw error;
    }
  }

  async getPendingInvitations(inviteeId: string): Promise<GroupInvitation[]> {
    try {
      const invitations = await this.remote.getPendingInvitations(inviteeId);
      const ownerId = readCurrentOwnerId();
      if (ownerId) {
        await this.bestEffort(() =>
          cachePendingInvitations(
            ownerId,
            inviteeId,
            invitations,
            new Date().toISOString(),
          ),
        );
      }
      return invitations;
    } catch (error) {
      const ownerId = readCurrentOwnerId();
      const cached = ownerId
        ? await readCachedPendingInvitations(ownerId, inviteeId)
        : null;
      if (cached) return cached;
      if (isOfflineFirstEnabled()) return [];
      throw error;
    }
  }

  getGroupCode(code: string): Promise<GroupCode | null> {
    return this.remote.getGroupCode(code);
  }

  getGroupJoinRequest(requestId: string): Promise<GroupJoinRequest | null> {
    return this.remote.getGroupJoinRequest(requestId);
  }

  getGroupJoinRequests(groupId: string): Promise<GroupJoinRequest[]> {
    return this.remote.getGroupJoinRequests(groupId);
  }
}
