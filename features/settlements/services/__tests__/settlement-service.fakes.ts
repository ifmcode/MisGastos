import type { IFriendLedgerRepository } from "@/features/friends/repositories/friend-ledger.repository";
import type { IFriendsRepository } from "@/features/friends/repositories/friends.repository";
import type { FriendLedgerEntry } from "@/features/friends/types/friend.types";
import type { NotificationWrite } from "@/features/notifications/types/notification.types";

import type { ISettlementsRepository } from "../../repositories/settlements.repository";
import type {
  CreateSettlementDto,
  Settlement,
  UpdateSettlementDto,
} from "../../types/settlement.types";
import { buildSettlement } from "../../repositories/__tests__/settlement-document.fixtures";

export interface CreatedSettlement {
  dto: CreateSettlementDto;
  settlement: Settlement;
  notification: NotificationWrite;
}

/** In-memory settlements repository; the service is tested without Firestore. */
export class FakeSettlementsRepository implements ISettlementsRepository {
  settlements: Settlement[] = [];
  created: CreatedSettlement[] = [];
  updates: Array<{
    viewerUid: string;
    settlementId: string;
    update: UpdateSettlementDto;
    notification: NotificationWrite;
  }> = [];
  deletes: Array<{
    viewerUid: string;
    settlementId: string;
    deletedAt: string;
    notification: NotificationWrite;
  }> = [];

  async getSettlement(settlementId: string): Promise<Settlement | null> {
    return (
      this.settlements.find((settlement) => settlement.id === settlementId) ??
      null
    );
  }

  async getSettlements(viewerUid: string): Promise<Settlement[]> {
    return this.settlements.filter((settlement) =>
      settlement.participantIds.includes(viewerUid),
    );
  }

  async createSettlement(
    dto: CreateSettlementDto,
    notification: (settlement: Settlement) => NotificationWrite,
  ): Promise<Settlement> {
    const settlement = buildSettlement({
      ...dto,
      id: `created-${this.created.length + 1}`,
    });
    const event = notification(settlement);

    this.created.push({ dto, settlement, notification: event });
    this.settlements.push(settlement);

    return settlement;
  }

  async updateSettlement(
    viewerUid: string,
    settlementId: string,
    update: UpdateSettlementDto,
    notification: NotificationWrite,
  ): Promise<Settlement> {
    this.updates.push({ viewerUid, settlementId, update, notification });

    return buildSettlement({ ...update, id: settlementId });
  }

  async softDeleteSettlement(
    viewerUid: string,
    settlementId: string,
    deletedAt: string,
    notification: NotificationWrite,
  ): Promise<void> {
    this.deletes.push({ viewerUid, settlementId, deletedAt, notification });
  }
}

/** Only `getFriendship` is needed; every other method is unused here. */
export function fakeFriendsRepository(
  isFriend: boolean,
): IFriendsRepository {
  return {
    getFriendship: async () => (isFriend ? { id: "pair" } : null),
  } as unknown as IFriendsRepository;
}

export function fakeLedgerRepository(
  entries: FriendLedgerEntry[],
): IFriendLedgerRepository {
  return { getEntries: async () => entries };
}
