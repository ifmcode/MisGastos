import type { NotificationWrite } from "@/features/notifications/types/notification.types";
import { readCurrentOwnerId } from "@/shared/lib/local-db/current-owner";

import type {
  CreateGroupSettlementDto,
  GroupSettlement,
  UpdateGroupSettlementDto,
} from "../types/group-settlement.types";
import {
  cacheGroupSettlement,
  cacheGroupSettlements,
  readCachedGroupSettlementById,
  readCachedGroupSettlements,
} from "./local-group-settlement.cache";
import type {
  GroupSettlementNotificationBuilder,
  IGroupSettlementsRepository,
} from "./group-settlements.repository";

/**
 * Read-through group settlements. The list is cached per group; a remote failure
 * falls back to that group's cache. Mutations delegate and mirror the record.
 */
export class CachedGroupSettlementsRepository
  implements IGroupSettlementsRepository
{
  constructor(private readonly remote: IGroupSettlementsRepository) {}

  async getGroupSettlement(
    settlementId: string,
  ): Promise<GroupSettlement | null> {
    try {
      const settlement = await this.remote.getGroupSettlement(settlementId);
      if (settlement) {
        await this.mirror(settlement);
        return settlement;
      }

      const ownerId = readCurrentOwnerId();
      if (!ownerId) return null;

      return readCachedGroupSettlementById(ownerId, settlementId);
    } catch (error) {
      const ownerId = readCurrentOwnerId();
      if (!ownerId) throw error;

      const match = await readCachedGroupSettlementById(ownerId, settlementId);
      if (match) return match;
      throw error;
    }
  }

  async getGroupSettlements(groupId: string): Promise<GroupSettlement[]> {
    try {
      const settlements = await this.remote.getGroupSettlements(groupId);
      await this.cacheList(groupId, settlements);
      return settlements;
    } catch (error) {
      const ownerId = readCurrentOwnerId();
      if (!ownerId) throw error;

      const cached = await readCachedGroupSettlements(ownerId, groupId);
      if (cached) return cached;
      throw error;
    }
  }

  async createGroupSettlement(
    dto: CreateGroupSettlementDto,
    notification: GroupSettlementNotificationBuilder,
  ): Promise<GroupSettlement> {
    return this.mirror(
      await this.remote.createGroupSettlement(dto, notification),
    );
  }

  async updateGroupSettlement(
    viewerUid: string,
    settlementId: string,
    update: UpdateGroupSettlementDto,
    notification: NotificationWrite,
  ): Promise<GroupSettlement> {
    return this.mirror(
      await this.remote.updateGroupSettlement(
        viewerUid,
        settlementId,
        update,
        notification,
      ),
    );
  }

  async softDeleteGroupSettlement(
    viewerUid: string,
    settlementId: string,
    deletedAt: string,
    notification: NotificationWrite,
  ): Promise<void> {
    await this.remote.softDeleteGroupSettlement(
      viewerUid,
      settlementId,
      deletedAt,
      notification,
    );
    await this.refresh(settlementId);
  }

  private async cacheList(
    groupId: string,
    settlements: readonly GroupSettlement[],
  ): Promise<void> {
    const ownerId = readCurrentOwnerId();
    if (!ownerId) return;

    try {
      await cacheGroupSettlements(
        ownerId,
        groupId,
        settlements,
        new Date().toISOString(),
      );
    } catch {
      // Best effort: the online read already succeeded.
    }
  }

  private async mirror(settlement: GroupSettlement): Promise<GroupSettlement> {
    const ownerId = readCurrentOwnerId();
    if (!ownerId) return settlement;

    try {
      await cacheGroupSettlement(
        ownerId,
        settlement,
        new Date().toISOString(),
      );
    } catch {
      // Best effort.
    }

    return settlement;
  }

  private async refresh(settlementId: string): Promise<void> {
    try {
      const updated = await this.remote.getGroupSettlement(settlementId);
      if (updated) await this.mirror(updated);
    } catch {
      // Best effort: the mutation already succeeded.
    }
  }
}
