import type {
  LocalRecordSyncStatus,
  LocalRow,
} from "@/shared/lib/local-db/local-db.types";
import { decodeLocalJson, encodeLocalJson } from "@/shared/lib/local-db/local-json";
import { readLocalRowId } from "@/shared/lib/local-db/local-row.readers";

import type { GroupExpense } from "../types/group-expense.types";
import { mapGroupExpenseDocument } from "./group-expenses.mapper";

/** Local row of one group expense; `ownerId` is the viewer who cached it. */
export function toGroupExpenseLocalRow(
  expense: GroupExpense,
  ownerId: string,
  syncStatus: LocalRecordSyncStatus = "synced",
): LocalRow {
  return {
    id: expense.id,
    ownerId,
    groupId: expense.groupId,
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

export function fromGroupExpenseLocalRow(row: LocalRow): GroupExpense | null {
  const id = readLocalRowId(row);
  if (!id) return null;

  return mapGroupExpenseDocument(id, {
    groupId: row.groupId,
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
