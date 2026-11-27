import type { NotificationWrite } from "@/features/notifications/types/notification.types";
import type { DatabasePort } from "@/shared/lib/local-db/database.port";
import type { LocalRow } from "@/shared/lib/local-db/local-db.types";
import { getLocalDatabase } from "@/shared/lib/local-db/local-db.runtime";
import {
  writeSocialCreate,
  writeSocialDelete,
  writeSocialUpdate,
} from "@/shared/lib/local-db/social-write";
import { createClientId } from "@/shared/utils/client-id";
import { INITIAL_REVISION } from "@/shared/utils/revision";

import type {
  CreateGroupSettlementDto,
  GroupSettlement,
  UpdateGroupSettlementDto,
} from "../types/group-settlement.types";
import {
  fromGroupSettlementLocalRow,
  toGroupSettlementLocalRow,
} from "./local-group-settlement.mapper";
import type {
  GroupSettlementNotificationBuilder,
  IGroupSettlementsRepository,
} from "./group-settlements.repository";

export interface OfflineGroupSettlementsOptions {
  getPort?: () => Promise<DatabasePort | null>;
  now?: () => string;
  createId?: () => string;
}

async function readRow(
  port: DatabasePort,
  ownerId: string,
  settlementId: string,
): Promise<GroupSettlement | null> {
  const rows = await port.select<LocalRow>("groupSettlements", {
    where: { id: settlementId, ownerId },
    limit: 1,
  });

  return rows[0] ? fromGroupSettlementLocalRow(rows[0]) : null;
}

/** Local-first group settlements with their notification replay payload. */
export class OfflineGroupSettlementsRepository
  implements IGroupSettlementsRepository
{
  private readonly getPort: () => Promise<DatabasePort | null>;
  private readonly now: () => string;
  private readonly createId: () => string;

  constructor(
    private readonly reader: IGroupSettlementsRepository,
    options: OfflineGroupSettlementsOptions = {},
  ) {
    this.getPort = options.getPort ?? getLocalDatabase;
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? createClientId;
  }

  getGroupSettlement(settlementId: string): Promise<GroupSettlement | null> {
    return this.reader.getGroupSettlement(settlementId);
  }

  getGroupSettlements(groupId: string): Promise<GroupSettlement[]> {
    return this.reader.getGroupSettlements(groupId);
  }

  async createGroupSettlement(
    dto: CreateGroupSettlementDto,
    notification: GroupSettlementNotificationBuilder,
  ): Promise<GroupSettlement> {
    const port = await this.getPort();
    if (!port) return this.reader.createGroupSettlement(dto, notification);

    const entity: GroupSettlement = {
      id: this.createId(),
      ...dto,
      revision: INITIAL_REVISION,
    };
    const event = notification(entity);

    return writeSocialCreate({
      port,
      ownerId: entity.createdBy,
      entity,
      entityType: "group-settlement",
      table: "groupSettlements",
      toRow: toGroupSettlementLocalRow,
      fromRow: fromGroupSettlementLocalRow,
      snapshot: (value) => ({ ...value }),
      extraSnapshot: { notification: event },
      createId: this.createId,
      now: this.now(),
    });
  }

  async updateGroupSettlement(
    viewerUid: string,
    settlementId: string,
    update: UpdateGroupSettlementDto,
    notification: NotificationWrite,
  ): Promise<GroupSettlement> {
    const port = await this.getPort();
    if (!port) {
      return this.reader.updateGroupSettlement(
        viewerUid,
        settlementId,
        update,
        notification,
      );
    }

    const stored = await readRow(port, viewerUid, settlementId);
    if (!stored) {
      return this.reader.updateGroupSettlement(
        viewerUid,
        settlementId,
        update,
        notification,
      );
    }

    return writeSocialUpdate({
      port,
      ownerId: viewerUid,
      entityId: settlementId,
      entity: applyUpdate(stored, update),
      entityType: "group-settlement",
      table: "groupSettlements",
      toRow: toGroupSettlementLocalRow,
      fromRow: fromGroupSettlementLocalRow,
      snapshot: (value) => ({ ...value }),
      extraSnapshot: { notification },
      createId: this.createId,
      now: this.now(),
    });
  }

  async softDeleteGroupSettlement(
    viewerUid: string,
    settlementId: string,
    deletedAt: string,
    notification: NotificationWrite,
  ): Promise<void> {
    const port = await this.getPort();
    if (!port) {
      return this.reader.softDeleteGroupSettlement(
        viewerUid,
        settlementId,
        deletedAt,
        notification,
      );
    }

    const stored = await readRow(port, viewerUid, settlementId);
    if (!stored) {
      return this.reader.softDeleteGroupSettlement(
        viewerUid,
        settlementId,
        deletedAt,
        notification,
      );
    }

    await writeSocialDelete({
      port,
      ownerId: viewerUid,
      entityId: settlementId,
      entity: { ...stored, deletedAt, updatedAt: deletedAt },
      entityType: "group-settlement",
      table: "groupSettlements",
      toRow: toGroupSettlementLocalRow,
      fromRow: fromGroupSettlementLocalRow,
      snapshot: (value) => ({ ...value }),
      extraSnapshot: { notification },
      createId: this.createId,
      now: this.now(),
    });
  }
}

function applyUpdate(
  stored: GroupSettlement,
  update: UpdateGroupSettlementDto,
): GroupSettlement {
  return {
    ...stored,
    ...update,
    receiverTransactionId:
      update.receiverTransactionId !== undefined
        ? update.receiverTransactionId
        : stored.receiverTransactionId,
  };
}
