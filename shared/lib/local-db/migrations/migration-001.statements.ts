/**
 * Frozen version 1 DDL. Migrations are append-only, so this snapshot must never
 * change: version 2 evolves the tables through `migration-002.ts`. The current
 * (fresh-install) shape lives in `schema.tables.ts`.
 */
export const MIGRATION_001_STATEMENTS: readonly string[] = [
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
    sortOrder INTEGER NOT NULL DEFAULT 0,
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
  `CREATE INDEX IF NOT EXISTS idx_wallets_owner_archived_created
    ON wallets (ownerId, archivedAt, createdAt)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_owner_date
    ON transactions (ownerId, date)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_owner_wallet
    ON transactions (ownerId, walletId)`,
  `CREATE INDEX IF NOT EXISTS idx_outbox_owner_seq ON outbox (ownerId, seq)`,
  `CREATE INDEX IF NOT EXISTS idx_conflicts_owner ON conflicts (ownerId)`,
];
