import type { NotificationWrite } from "@/features/notifications/types/notification.types";

import type { IGroupSettlementsRepository } from "../../repositories/group-settlements.repository";
import type {
  CreateGroupSettlementDto,
  GroupSettlement,
  UpdateGroupSettlementDto,
} from "../../types/group-settlement.types";
import { GROUP_ID, NOW } from "./group-expenses-service.fakes";

export function buildGroupSettlement(
  overrides: Partial<GroupSettlement> = {},
): GroupSettlement {
  return {
    id: "group-settlement-1",
    groupId: GROUP_ID,
    participantIds: ["user-b", "user-c"],
    pairId: "user-b__user-c",
    fromUserId: "user-b",
    toUserId: "user-c",
    amountCents: 1000,
    currency: "EUR",
    date: "2026-11-10",
    note: "Dinner",
    createdBy: "user-b",
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    receiverWalletId: null,
    receiverCategoryId: null,
    receiverTransactionId: null,
    ...overrides,
  };
}

/** In-memory settlements repository; the service tests never touch Firestore. */
export class FakeGroupSettlementsRepository
  implements IGroupSettlementsRepository
{
  readonly settlements = new Map<string, GroupSettlement>();
  readonly createCalls: Array<{
    dto: CreateGroupSettlementDto;
    notification: NotificationWrite;
  }> = [];
  readonly updateCalls: Array<{
    viewerUid: string;
    settlementId: string;
    update: UpdateGroupSettlementDto;
    notification: NotificationWrite;
  }> = [];
  readonly deleteCalls: Array<{
    viewerUid: string;
    settlementId: string;
    deletedAt: string;
    notification: NotificationWrite;
  }> = [];

  seed(settlement: GroupSettlement): GroupSettlement {
    this.settlements.set(settlement.id, settlement);
    return settlement;
  }

  async getGroupSettlement(settlementId: string): Promise<GroupSettlement | null> {
    return this.settlements.get(settlementId) ?? null;
  }

  async getGroupSettlements(groupId: string): Promise<GroupSettlement[]> {
    return Array.from(this.settlements.values()).filter(
      (settlement) => settlement.groupId === groupId,
    );
  }

  async createGroupSettlement(
    dto: CreateGroupSettlementDto,
    notification: (settlement: GroupSettlement) => NotificationWrite,
  ): Promise<GroupSettlement> {
    const settlement = buildGroupSettlement({
      ...dto,
      id: `created-settlement-${this.createCalls.length + 1}`,
      receiverTransactionId: dto.receiverWalletId ? "movement-1" : null,
    });

    this.createCalls.push({ dto, notification: notification(settlement) });
    this.settlements.set(settlement.id, settlement);

    return settlement;
  }

  async updateGroupSettlement(
    viewerUid: string,
    settlementId: string,
    update: UpdateGroupSettlementDto,
    notification: NotificationWrite,
  ): Promise<GroupSettlement> {
    this.updateCalls.push({ viewerUid, settlementId, update, notification });

    const existing = this.settlements.get(settlementId) ?? buildGroupSettlement();
    const updated = {
      ...existing,
      ...update,
      receiverTransactionId: update.receiverWalletId ? "movement-1" : null,
    };
    this.settlements.set(settlementId, updated);

    return updated;
  }

  async softDeleteGroupSettlement(
    viewerUid: string,
    settlementId: string,
    deletedAt: string,
    notification: NotificationWrite,
  ): Promise<void> {
    this.deleteCalls.push({ viewerUid, settlementId, deletedAt, notification });

    const existing = this.settlements.get(settlementId);
    if (!existing) return;

    this.settlements.set(settlementId, {
      ...existing,
      deletedAt,
      updatedAt: deletedAt,
    });
  }
}
