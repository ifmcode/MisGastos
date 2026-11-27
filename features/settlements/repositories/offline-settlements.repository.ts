import type { DatabasePort } from "@/shared/lib/local-db/database.port";import type { LocalRow } from "@/shared/lib/local-db/local-db.types";
import { getLocalDatabase } from "@/shared/lib/local-db/local-db.runtime";
import {
  writeSocialCreate,
  writeSocialDelete,
  writeSocialUpdate,
} from "@/shared/lib/local-db/social-write";
import { createClientId } from "@/shared/utils/client-id";
import { INITIAL_REVISION } from "@/shared/utils/revision";
import type { NotificationWrite } from "@/features/notifications/types/notification.types";

import type {
  CreateSettlementDto,
  Settlement,
  UpdateSettlementDto,
} from "../types/settlement.types";
import {
  fromSettlementLocalRow,
  toSettlementLocalRow,
} from "./local-settlement.mapper";
import type { ISettlementsRepository } from "./settlements.repository";

export interface OfflineSettlementsOptions {
  getPort?: () => Promise<DatabasePort | null>;
  now?: () => string;
  createId?: () => string;
}

async function readRow(
  port: DatabasePort,
  ownerId: string,
  settlementId: string,
): Promise<Settlement | null> {
  const rows = await port.select<LocalRow>("settlements", {
    where: { id: settlementId, ownerId },
    limit: 1,
  });

  return rows[0] ? fromSettlementLocalRow(rows[0]) : null;
}

/**
 * Local-first 1:1 settlements. The notification is built with the local id and
 * stored in the outbox snapshot, so the push can write the same document the
 * online path would have written.
 */
export class OfflineSettlementsRepository implements ISettlementsRepository {
  private readonly getPort: () => Promise<DatabasePort | null>;
  private readonly now: () => string;
  private readonly createId: () => string;

  constructor(
    private readonly reader: ISettlementsRepository,
    options: OfflineSettlementsOptions = {},
  ) {
    this.getPort = options.getPort ?? getLocalDatabase;
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? createClientId;
  }

  getSettlement(settlementId: string): Promise<Settlement | null> {
    return this.reader.getSettlement(settlementId);
  }

  getSettlements(viewerUid: string): Promise<Settlement[]> {
    return this.reader.getSettlements(viewerUid);
  }

  async createSettlement(
    dto: CreateSettlementDto,
    notification: Parameters<ISettlementsRepository["createSettlement"]>[1],
  ): Promise<Settlement> {
    const port = await this.getPort();
    if (!port) return this.reader.createSettlement(dto, notification);

    const entity: Settlement = {
      id: this.createId(),
      ...dto,
      revision: INITIAL_REVISION,
    };
    const event = notification(entity);

    return writeSocialCreate({
      port,
      ownerId: entity.createdBy,
      entity,
      entityType: "settlement",
      table: "settlements",
      toRow: toSettlementLocalRow,
      fromRow: fromSettlementLocalRow,
      snapshot: (value) => ({ ...value }),
      extraSnapshot: { notification: event },
      createId: this.createId,
      now: this.now(),
    });
  }

  async updateSettlement(
    viewerUid: string,
    settlementId: string,
    update: UpdateSettlementDto,
    notification: NotificationWrite,
  ): Promise<Settlement> {
    const port = await this.getPort();
    if (!port) {
      return this.reader.updateSettlement(
        viewerUid,
        settlementId,
        update,
        notification,
      );
    }

    const stored = await readRow(port, viewerUid, settlementId);
    if (!stored) {
      return this.reader.updateSettlement(
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
      entityType: "settlement",
      table: "settlements",
      toRow: toSettlementLocalRow,
      fromRow: fromSettlementLocalRow,
      snapshot: (value) => ({ ...value }),
      extraSnapshot: { notification },
      createId: this.createId,
      now: this.now(),
    });
  }

  async softDeleteSettlement(
    viewerUid: string,
    settlementId: string,
    deletedAt: string,
    notification: NotificationWrite,
  ): Promise<void> {
    const port = await this.getPort();
    if (!port) {
      return this.reader.softDeleteSettlement(
        viewerUid,
        settlementId,
        deletedAt,
        notification,
      );
    }

    const stored = await readRow(port, viewerUid, settlementId);
    if (!stored) {
      return this.reader.softDeleteSettlement(
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
      entityType: "settlement",
      table: "settlements",
      toRow: toSettlementLocalRow,
      fromRow: fromSettlementLocalRow,
      snapshot: (value) => ({ ...value }),
      extraSnapshot: { notification },
      createId: this.createId,
      now: this.now(),
    });
  }
}

function applyUpdate(
  stored: Settlement,
  update: UpdateSettlementDto,
): Settlement {
  return {
    ...stored,
    ...update,
    receiverTransactionId:
      update.receiverTransactionId !== undefined
        ? update.receiverTransactionId
        : stored.receiverTransactionId,
  };
}
