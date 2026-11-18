import type { NotificationWrite } from "@/features/notifications/types/notification.types";

import type {
  CreateSettlementDto,
  Settlement,
  UpdateSettlementDto,
} from "../types/settlement.types";

/**
 * The settlement id only exists once the document reference is generated, so a
 * new settlement receives a builder that produces its deterministic event
 * notification inside the same transaction.
 */
export type SettlementNotificationBuilder = (
  settlement: Settlement,
) => NotificationWrite;

export interface ISettlementsRepository {
  /** Reads one settlement by id; rules keep it participant-only. */
  getSettlement(settlementId: string): Promise<Settlement | null>;

  /** Every settlement the viewer participates in, soft-deleted included. */
  getSettlements(viewerUid: string): Promise<Settlement[]>;

  /** Settlement + optional creditor income + notification in one transaction. */
  createSettlement(
    dto: CreateSettlementDto,
    notification: SettlementNotificationBuilder,
  ): Promise<Settlement>;

  /** Only mutable fields; the pair, direction and `createdAt` never change. */
  updateSettlement(
    viewerUid: string,
    settlementId: string,
    update: UpdateSettlementDto,
    notification: NotificationWrite,
  ): Promise<Settlement>;

  /** Soft delete: reverts the creditor income once and keeps the record. */
  softDeleteSettlement(
    viewerUid: string,
    settlementId: string,
    deletedAt: string,
    notification: NotificationWrite,
  ): Promise<void>;
}
