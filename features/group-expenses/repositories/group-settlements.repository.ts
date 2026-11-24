import type { NotificationWrite } from "@/features/notifications/types/notification.types";

import type {
  CreateGroupSettlementDto,
  GroupSettlement,
  UpdateGroupSettlementDto,
} from "../types/group-settlement.types";

/**
 * The settlement id only exists once the document reference is generated, so a
 * new settlement receives a builder that produces its event notification.
 */
export type GroupSettlementNotificationBuilder = (
  settlement: GroupSettlement,
) => NotificationWrite;

/** Options of an edit; the repository exposes them as one argument. */
export interface UpdateGroupSettlementOperationOptions {
  viewerUid: string;
  settlementId: string;
  update: UpdateGroupSettlementDto;
  notification: NotificationWrite;
}

/**
 * Group settlement persistence (TICKET-010 Phase B). The service owns the
 * membership, direction and debt guards; this seam only talks to Firestore and
 * keeps the settlement, the creditor income and the wallet balance in sync.
 */
export interface IGroupSettlementsRepository {
  /** Reads one settlement by id; rules keep it group-member-only. */
  getGroupSettlement(settlementId: string): Promise<GroupSettlement | null>;

  /** Every settlement of one group, soft-deleted included (audit trail). */
  getGroupSettlements(groupId: string): Promise<GroupSettlement[]>;

  /** Settlement + optional creditor income + wallet in one transaction. */
  createGroupSettlement(
    dto: CreateGroupSettlementDto,
    notification: GroupSettlementNotificationBuilder,
  ): Promise<GroupSettlement>;

  /** Only mutable fields; the group, pair, direction and `createdAt` never change. */
  updateGroupSettlement(
    viewerUid: string,
    settlementId: string,
    update: UpdateGroupSettlementDto,
    notification: NotificationWrite,
  ): Promise<GroupSettlement>;

  /** Soft delete: reverts the creditor income once and keeps the record. */
  softDeleteGroupSettlement(
    viewerUid: string,
    settlementId: string,
    deletedAt: string,
    notification: NotificationWrite,
  ): Promise<void>;
}
