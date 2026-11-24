import type { LocalRow } from "@/shared/lib/local-db/local-db.types";
import {
  readLocalRowId,
  readLocalRowOwnerId,
} from "@/shared/lib/local-db/local-row.readers";
import { toIsoTimestamp } from "@/shared/utils/date";

import { Transfer } from "../types/transfer.types";
import { mapTransferDocument } from "./transfer.mapper";

const EPOCH_ISO = new Date(0).toISOString();

/**
 * Cache mapping for transfers. `toTransferLocalRow` keeps the stored wallet
 * names (survive a permanent wallet deletion); `fromTransferLocalRow` rebuilds
 * the Firestore-shaped document and delegates to `mapTransferDocument` so the
 * amount/currency/date validation is not duplicated.
 */
export function toTransferLocalRow(transfer: Transfer): LocalRow {
  return {
    id: transfer.id,
    ownerId: transfer.ownerId,
    fromWalletId: transfer.fromWalletId,
    toWalletId: transfer.toWalletId,
    fromWalletName: transfer.fromWalletName ?? null,
    toWalletName: transfer.toWalletName ?? null,
    amount: transfer.amount,
    currency: transfer.currency,
    date: transfer.date,
    notes: transfer.notes ?? null,
    createdAt: toIsoTimestamp(transfer.createdAt) ?? EPOCH_ISO,
    updatedAt: toIsoTimestamp(transfer.updatedAt) ?? EPOCH_ISO,
    deletedAt: transfer.deletedAt ?? null,
    revision: transfer.revision,
    syncStatus: "synced",
  };
}

export function fromTransferLocalRow(row: LocalRow): Transfer | null {
  const id = readLocalRowId(row);
  if (!id) return null;

  return mapTransferDocument(
    id,
    {
      ownerId: row.ownerId,
      fromWalletId: row.fromWalletId,
      toWalletId: row.toWalletId,
      fromWalletName: row.fromWalletName,
      toWalletName: row.toWalletName,
      amount: row.amount,
      currency: row.currency,
      date: row.date,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
      revision: row.revision,
    },
    readLocalRowOwnerId(row),
  );
}
