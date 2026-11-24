/**
 * Local schema version 2 (ADR 2026-11-14 §4 plus the phase-3 read cache). ISO
 * dates are TEXT, booleans and counters are INTEGER, money is REAL only as a
 * storage type: every calculation still goes through `roundMoney` and the
 * signed balance helpers.
 *
 * This is the current shape a fresh install reaches after running every
 * migration. Version 1 is frozen in `migrations/migration-001.statements.ts`.
 */
export const SCHEMA_TABLE_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY NOT NULL,
    ownerId TEXT NOT NULL,
    name TEXT NOT NULL,
    currency TEXT NOT NULL,
    type TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    initialBalance REAL NOT NULL DEFAULT 0,
    serverBalance REAL NOT NULL DEFAULT 0,
    includeInTotal INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    archivedAt TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    deletedAt TEXT,
    revision INTEGER NOT NULL DEFAULT 0,
    syncStatus TEXT NOT NULL DEFAULT 'synced'
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
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
  `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY NOT NULL,
    ownerId TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL,
    walletId TEXT NOT NULL,
    walletName TEXT,
    categoryId TEXT,
    concept TEXT,
    date TEXT NOT NULL,
    notes TEXT,
    sharedExpenseId TEXT,
    groupExpenseId TEXT,
    settlementId TEXT,
    groupSettlementId TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    deletedAt TEXT,
    revision INTEGER NOT NULL DEFAULT 0,
    syncStatus TEXT NOT NULL DEFAULT 'synced'
  )`,
  `CREATE TABLE IF NOT EXISTS transfers (
    id TEXT PRIMARY KEY NOT NULL,
    ownerId TEXT NOT NULL,
    fromWalletId TEXT NOT NULL,
    toWalletId TEXT NOT NULL,
    fromWalletName TEXT,
    toWalletName TEXT,
    amount REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    deletedAt TEXT,
    revision INTEGER NOT NULL DEFAULT 0,
    syncStatus TEXT NOT NULL DEFAULT 'synced'
  )`,
  `CREATE TABLE IF NOT EXISTS outbox (
    clientMutationId TEXT PRIMARY KEY NOT NULL,
    ownerId TEXT NOT NULL,
    seq INTEGER NOT NULL,
    entityType TEXT NOT NULL,
    entityId TEXT NOT NULL,
    operation TEXT NOT NULL,
    baseRevision INTEGER NOT NULL DEFAULT 0,
    localSnapshot TEXT NOT NULL DEFAULT '{}',
    serverSnapshot TEXT NOT NULL DEFAULT '{}',
    dependsOn TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    nextAttemptAt TEXT,
    lastErrorCode TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    UNIQUE (ownerId, entityType, entityId)
  )`,
  `CREATE TABLE IF NOT EXISTS outboxSeq (
    ownerId TEXT PRIMARY KEY NOT NULL,
    nextSeq INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS conflicts (
    id TEXT PRIMARY KEY NOT NULL,
    ownerId TEXT NOT NULL,
    clientMutationId TEXT NOT NULL,
    entityType TEXT NOT NULL,
    entityId TEXT NOT NULL,
    kind TEXT NOT NULL,
    localSnapshot TEXT,
    remoteSnapshot TEXT,
    detectedAt TEXT NOT NULL,
    resolvedAt TEXT,
    resolution TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS syncState (
    ownerId TEXT PRIMARY KEY NOT NULL,
    lastPullAt TEXT,
    lastPushAt TEXT,
    lastFullSyncAt TEXT,
    lastErrorCode TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS cacheMeta (
    ownerId TEXT NOT NULL,
    collection TEXT NOT NULL,
    fetchedAt TEXT NOT NULL,
    PRIMARY KEY (ownerId, collection)
  )`,
];

/** Indexes required by ADR §4 (plus the owner lookup for conflicts). */
export const SCHEMA_INDEX_STATEMENTS: readonly string[] = [
  `CREATE INDEX IF NOT EXISTS idx_wallets_owner_archived_created
    ON wallets (ownerId, archivedAt, createdAt)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_owner_date
    ON transactions (ownerId, date)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_owner_wallet
    ON transactions (ownerId, walletId)`,
  `CREATE INDEX IF NOT EXISTS idx_outbox_owner_seq ON outbox (ownerId, seq)`,
  `CREATE INDEX IF NOT EXISTS idx_conflicts_owner ON conflicts (ownerId)`,
];
