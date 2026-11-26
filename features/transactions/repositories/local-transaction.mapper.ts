import type {
  LocalRecordSyncStatus,
  LocalRow,
} from "@/shared/lib/local-db/local-db.types";
import {
  readLocalRowId,
  readLocalRowOwnerId,
} from "@/shared/lib/local-db/local-row.readers";
import { toIsoTimestamp } from "@/shared/utils/date";

import { Transaction } from "../types/transaction.types";
import { mapTransactionDocument } from "./transaction.mapper";

const EPOCH_ISO = new Date(0).toISOString();

/**
 * Cache mapping for movements. `toTransactionLocalRow` persists every link id
 * and the soft-delete stamp; `fromTransactionLocalRow` rebuilds the
 * Firestore-shaped document and delegates to `mapTransactionDocument`, which
 * owns validation, date normalisation and the type-specific link rules.
 */
export function toTransactionLocalRow(
  transaction: Transaction,
  syncStatus: LocalRecordSyncStatus = "synced",
): LocalRow {
  return {
    id: transaction.id,
    ownerId: transaction.ownerId,
    type: transaction.type,
    amount: transaction.amount,
    currency: transaction.currency,
    walletId: transaction.walletId,
    walletName: transaction.walletName ?? null,
    categoryId: transaction.categoryId,
    concept: transaction.concept,
    date: transaction.date,
    notes: transaction.notes ?? null,
    sharedExpenseId: transaction.sharedExpenseId ?? null,
    groupExpenseId: transaction.groupExpenseId ?? null,
    settlementId: transaction.settlementId ?? null,
    groupSettlementId: transaction.groupSettlementId ?? null,
    createdAt: toIsoTimestamp(transaction.createdAt) ?? EPOCH_ISO,
    updatedAt: toIsoTimestamp(transaction.updatedAt) ?? EPOCH_ISO,
    deletedAt: transaction.deletedAt ?? null,
    revision: transaction.revision,
    syncStatus,
  };
}

export function fromTransactionLocalRow(row: LocalRow): Transaction | null {
  const id = readLocalRowId(row);
  if (!id) return null;

  return mapTransactionDocument(
    id,
    {
      ownerId: row.ownerId,
      type: row.type,
      amount: row.amount,
      currency: row.currency,
      walletId: row.walletId,
      walletName: row.walletName,
      categoryId: row.categoryId,
      concept: row.concept,
      date: row.date,
      notes: row.notes,
      sharedExpenseId: row.sharedExpenseId,
      groupExpenseId: row.groupExpenseId,
      settlementId: row.settlementId,
      groupSettlementId: row.groupSettlementId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
      revision: row.revision,
    },
    readLocalRowOwnerId(row),
  );
}
