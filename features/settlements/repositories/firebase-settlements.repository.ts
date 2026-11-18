import type { NotificationWrite } from "@/features/notifications/types/notification.types";

import type {
  CreateSettlementDto,
  Settlement,
  UpdateSettlementDto,
} from "../types/settlement.types";
import { createSettlementOperation } from "./settlement-create.operation";
import { softDeleteSettlementOperation } from "./settlement-delete.operation";
import { updateSettlementOperation } from "./settlement-update.operation";
import {
  getSettlementOperation,
  getSettlementsOperation,
} from "./settlements.operations";
import type {
  ISettlementsRepository,
  SettlementNotificationBuilder,
} from "./settlements.repository";

export class FirebaseSettlementsRepository implements ISettlementsRepository {
  getSettlement(settlementId: string): Promise<Settlement | null> {
    return getSettlementOperation(settlementId);
  }

  getSettlements(viewerUid: string): Promise<Settlement[]> {
    return getSettlementsOperation(viewerUid);
  }

  createSettlement(
    dto: CreateSettlementDto,
    notification: SettlementNotificationBuilder,
  ): Promise<Settlement> {
    return createSettlementOperation(dto, notification);
  }

  updateSettlement(
    viewerUid: string,
    settlementId: string,
    update: UpdateSettlementDto,
    notification: NotificationWrite,
  ): Promise<Settlement> {
    return updateSettlementOperation({
      viewerUid,
      settlementId,
      update,
      notification,
    });
  }

  softDeleteSettlement(
    viewerUid: string,
    settlementId: string,
    deletedAt: string,
    notification: NotificationWrite,
  ): Promise<void> {
    return softDeleteSettlementOperation({
      viewerUid,
      settlementId,
      deletedAt,
      notification,
    });
  }
}
