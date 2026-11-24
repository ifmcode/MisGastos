import type { LocalDbMigration } from "../local-db.types";

/**
 * Version 2: the columns the read cache needs to rebuild a full record plus
 * the per-owner collection bookkeeping (`cacheMeta`) that tells a cold cache
 * from a fetched-but-empty one.
 */
export const MIGRATION_002: LocalDbMigration = {
  version: 2,
  statements: [
    `ALTER TABLE transactions ADD COLUMN sharedExpenseId TEXT`,
    `ALTER TABLE transactions ADD COLUMN groupExpenseId TEXT`,
    `ALTER TABLE transactions ADD COLUMN settlementId TEXT`,
    `ALTER TABLE transactions ADD COLUMN groupSettlementId TEXT`,
    `ALTER TABLE transfers ADD COLUMN fromWalletName TEXT`,
    `ALTER TABLE transfers ADD COLUMN toWalletName TEXT`,
    // `categories.sortOrder` is genuinely optional (legacy documents fall back
    // to createdAt/name in `compareCategories`), but v1 declared it NOT NULL.
    // A legacy category would fail the cache insert on a device, so the table
    // is rebuilt: SQLite cannot drop the constraint with ALTER. Storing 0
    // instead would move legacy categories to the front and change the order.
    `CREATE TABLE categories_v2 (
      id TEXT PRIMARY KEY NOT NULL,
      ownerId TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      sortOrder INTEGER,
      legacyId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT,
      revision INTEGER NOT NULL DEFAULT 0,
      syncStatus TEXT NOT NULL DEFAULT 'synced'
    )`,
    `INSERT INTO categories_v2 (
      id, ownerId, name, type, color, icon, sortOrder, legacyId,
      createdAt, updatedAt, deletedAt, revision, syncStatus
    )
    SELECT
      id, ownerId, name, type, color, icon, sortOrder, legacyId,
      createdAt, updatedAt, deletedAt, revision, syncStatus
    FROM categories`,
    `DROP TABLE categories`,
    `ALTER TABLE categories_v2 RENAME TO categories`,
    `CREATE TABLE IF NOT EXISTS cacheMeta (
      ownerId TEXT NOT NULL,
      collection TEXT NOT NULL,
      fetchedAt TEXT NOT NULL,
      PRIMARY KEY (ownerId, collection)
    )`,
  ],
};
