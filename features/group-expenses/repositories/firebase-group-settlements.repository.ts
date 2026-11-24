import type { NotificationWrite } from "@/features/notifications/types/notification.types";

import type {
  CreateGroupSettlementDto,
  GroupSettlement,
  UpdateGroupSettlementDto,
} from "../types/group-settlement.types";
import { createGroupSettlementOperation } from "./group-settlement-create.operation";
import { softDeleteGroupSettlementOperation } from "./group-settlement-delete.operation";
import { updateGroupSettlementOperation } from "./group-settlement-update.operation";import {
  getGroupSettlementOperation,
  getGroupSettlementsOperation,
} from "./group-settlements.operations";
import type {
  GroupSettlementNotificationBuilder,
  IGroupSettlementsRepository,
  UpdateGroupSettlementOperationOptions,
} from "./group-settlements.repository";

/** Firestore implementation: no business rule lives here. */
export class FirebaseGroupSettlementsRepository
  implements IGroupSettlementsRepository
{
  getGroupSettlement(settlementId: string): Promise<GroupSettlement | null> {
    return getGroupSettlementOperation(settlementId);
  }

  getGroupSettlements(groupId: string): Promise<GroupSettlement[]> {
    return getGroupSettlementsOperation(groupId);
  }

  createGroupSettlement(
    dto: CreateGroupSettlementDto,
    notification: GroupSettlementNotificationBuilder,
  ): Promise<GroupSettlement> {
    return createGroupSettlementOperation(dto, notification);
  }

  updateGroupSettlement(
    viewerUid: string,
    settlementId: string,
    update: UpdateGroupSettlementDto,
    notification: NotificationWrite,
  ): Promise<GroupSettlement> {
    return updateGroupSettlementOperation({
      viewerUid,
      settlementId,
      update,
      notification,
    });
  }

  softDeleteGroupSettlement(
    viewerUid: string,
    settlementId: string,
    deletedAt: string,
    notification: NotificationWrite,
  ): Promise<void> {
    return softDeleteGroupSettlementOperation({
      viewerUid,
      settlementId,
      deletedAt,
      notification,
    });
  }
}
