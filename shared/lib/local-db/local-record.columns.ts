import type { LocalRow, OutboxEntityType } from "./local-db.types";

/** Record tables the sync engine can write locally. */
export type SyncedEntityType =
  | "transaction"
  | "transfer"
  | "shared-expense"
  | "settlement"
  | "group-expense"
  | "group-settlement";

export const RECORD_TABLE: Record<
  SyncedEntityType,
  | "transactions"
  | "transfers"
  | "sharedExpenses"
  | "settlements"
  | "groupExpenses"
  | "groupSettlements"
> = {
  transaction: "transactions",
  transfer: "transfers",
  "shared-expense": "sharedExpenses",
  settlement: "settlements",
  "group-expense": "groupExpenses",
  "group-settlement": "groupSettlements",
};

const RECORD_COLUMNS: Record<SyncedEntityType, readonly string[]> = {
  transaction: [
    "id",
    "ownerId",
    "type",
    "amount",
    "currency",
    "walletId",
    "walletName",
    "categoryId",
    "concept",
    "date",
    "notes",
    "sharedExpenseId",
    "groupExpenseId",
    "settlementId",
    "groupSettlementId",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "revision",
  ],
  transfer: [
    "id",
    "ownerId",
    "fromWalletId",
    "toWalletId",
    "fromWalletName",
    "toWalletName",
    "amount",
    "currency",
    "date",
    "notes",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "revision",
  ],
  "shared-expense": [
    "id",
    "ownerId",
    "participantIds",
    "pairId",
    "payerId",
    "amountCents",
    "currency",
    "splitMode",
    "participants",
    "description",
    "date",
    "walletId",
    "categoryId",
    "linkedTransactionId",
    "createdBy",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "revision",
  ],
  settlement: [
    "id",
    "ownerId",
    "participantIds",
    "pairId",
    "fromUserId",
    "toUserId",
    "amountCents",
    "currency",
    "date",
    "note",
    "createdBy",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "receiverWalletId",
    "receiverCategoryId",
    "receiverTransactionId",
    "revision",
  ],
  "group-expense": [
    "id",
    "ownerId",
    "groupId",
    "payerId",
    "amountCents",
    "currency",
    "splitMode",
    "participants",
    "description",
    "date",
    "walletId",
    "categoryId",
    "linkedTransactionId",
    "createdBy",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "revision",
  ],
  "group-settlement": [
    "id",
    "ownerId",
    "groupId",
    "participantIds",
    "pairId",
    "fromUserId",
    "toUserId",
    "amountCents",
    "currency",
    "date",
    "note",
    "createdBy",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "receiverWalletId",
    "receiverCategoryId",
    "receiverTransactionId",
    "revision",
  ],
};

export function resolveSyncedEntityType(
  entityType: OutboxEntityType,
): SyncedEntityType {
  if (
    entityType === "transaction" ||
    entityType === "transfer" ||
    entityType === "shared-expense" ||
    entityType === "settlement" ||
    entityType === "group-expense" ||
    entityType === "group-settlement"
  ) {
    return entityType;
  }

  throw new Error("SYNC_UNSUPPORTED_ENTITY");
}

/** Keeps only the columns the local table declares, as scalar values. */
export function pickRecordColumns(
  snapshot: Record<string, unknown>,
  entityType: SyncedEntityType,
): LocalRow {
  const row: LocalRow = {};

  for (const column of RECORD_COLUMNS[entityType]) {
    const value = snapshot[column];
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      value === null
    ) {
      row[column] = value;
    } else if (Array.isArray(value)) {
      // Social snapshots keep their lists as arrays; the local columns store
      // them as JSON (see `local-json.ts`).
      row[column] = JSON.stringify(value);
    }
  }

  return row;
}
