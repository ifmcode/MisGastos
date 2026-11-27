import type {
  LocalRecordSyncStatus,
  LocalRow,
} from "@/shared/lib/local-db/local-db.types";
import { decodeLocalJson, encodeLocalJson } from "@/shared/lib/local-db/local-json";
import { readLocalRowId } from "@/shared/lib/local-db/local-row.readers";

import type { Settlement } from "../types/settlement.types";
import { mapSettlementDocument } from "./settlements.mapper";

/** Local row of one settlement; `ownerId` is the viewer who cached it. */
export function toSettlementLocalRow(
  settlement: Settlement,
  ownerId: string,
  syncStatus: LocalRecordSyncStatus = "synced",
): LocalRow {
  return {
    id: settlement.id,
    ownerId,
    participantIds: encodeLocalJson(settlement.participantIds),
    pairId: settlement.pairId,
    fromUserId: settlement.fromUserId,
    toUserId: settlement.toUserId,
    amountCents: settlement.amountCents,
    currency: settlement.currency,
    date: settlement.date,
    note: settlement.note,
    createdBy: settlement.createdBy,
    createdAt: settlement.createdAt,
    updatedAt: settlement.updatedAt,
    deletedAt: settlement.deletedAt,
    receiverWalletId: settlement.receiverWalletId,
    receiverCategoryId: settlement.receiverCategoryId,
    receiverTransactionId: settlement.receiverTransactionId,
    revision: settlement.revision,
    syncStatus,
  };
}

export function fromSettlementLocalRow(row: LocalRow): Settlement | null {
  const id = readLocalRowId(row);
  if (!id) return null;

  return mapSettlementDocument(id, {
    participantIds: decodeLocalJson(row.participantIds),
    pairId: row.pairId,
    fromUserId: row.fromUserId,
    toUserId: row.toUserId,
    amountCents: row.amountCents,
    currency: row.currency,
    date: row.date,
    note: row.note,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    receiverWalletId: row.receiverWalletId,
    receiverCategoryId: row.receiverCategoryId,
    receiverTransactionId: row.receiverTransactionId,
    revision: row.revision,
  });
}
