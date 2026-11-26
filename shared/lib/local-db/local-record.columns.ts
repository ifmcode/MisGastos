import type { LocalRow, OutboxEntityType } from "./local-db.types";

/** Record tables the sync engine can write locally. */
export type SyncedEntityType = "transaction" | "transfer";

export const RECORD_TABLE: Record<
  SyncedEntityType,
  "transactions" | "transfers"
> = {
  transaction: "transactions",
  transfer: "transfers",
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
};

export function resolveSyncedEntityType(
  entityType: OutboxEntityType,
): SyncedEntityType {
  if (entityType === "transaction" || entityType === "transfer") {
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
    }
  }

  return row;
}
