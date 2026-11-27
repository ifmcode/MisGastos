import type {
  LocalRecordSyncStatus,
  LocalRow,
} from "@/shared/lib/local-db/local-db.types";
import { decodeLocalJson, encodeLocalJson } from "@/shared/lib/local-db/local-json";
import { readLocalRowId } from "@/shared/lib/local-db/local-row.readers";

import type { SharedExpense } from "../types/shared-expense.types";
import { mapSharedExpenseDocument } from "./shared-expenses.mapper";

/** Local row of one shared expense; `ownerId` is the viewer who cached it. */
export function toSharedExpenseLocalRow(
  expense: SharedExpense,
  ownerId: string,
  syncStatus: LocalRecordSyncStatus = "synced",
): LocalRow {
  return {
    id: expense.id,
    ownerId,
    participantIds: encodeLocalJson(expense.participantIds),
    pairId: expense.pairId,
    payerId: expense.payerId,
    amountCents: expense.amountCents,
    currency: expense.currency,
    splitMode: expense.splitMode,
    participants: encodeLocalJson(expense.participants),
    description: expense.description,
    date: expense.date,
    walletId: expense.walletId,
    categoryId: expense.categoryId,
    linkedTransactionId: expense.linkedTransactionId,
    createdBy: expense.createdBy,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
    deletedAt: expense.deletedAt,
    revision: expense.revision,
    syncStatus,
  };
}

export function fromSharedExpenseLocalRow(row: LocalRow): SharedExpense | null {
  const id = readLocalRowId(row);
  if (!id) return null;

  return mapSharedExpenseDocument(id, {
    participantIds: decodeLocalJson(row.participantIds),
    pairId: row.pairId,
    payerId: row.payerId,
    amountCents: row.amountCents,
    currency: row.currency,
    splitMode: row.splitMode,
    participants: decodeLocalJson(row.participants),
    description: row.description,
    date: row.date,
    walletId: row.walletId,
    categoryId: row.categoryId,
    linkedTransactionId: row.linkedTransactionId,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    revision: row.revision,
  });
}
