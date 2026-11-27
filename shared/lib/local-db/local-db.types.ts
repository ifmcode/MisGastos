/**
 * Scalar values the local SQLite database can hold. Booleans are stored as
 * 0/1 and ISO dates as TEXT, so every column is one of these three.
 */
export type LocalColumnValue = string | number | null;

export type LocalRow = Record<string, LocalColumnValue>;
export type LocalWhere = Record<string, LocalColumnValue>;

export type LocalTableName =
  | "wallets"
  | "categories"
  | "transactions"
  | "transfers"
  | "friendships"
  | "friendRequests"
  | "publicProfiles"
  | "groups"
  | "groupInvitations"
  | "sharedExpenses"
  | "settlements"
  | "groupExpenses"
  | "groupSettlements"
  | "outbox"
  | "outboxSeq"
  | "conflicts"
  | "syncState"
  | "cacheMeta";

/**
 * Collections mirrored into the local read cache. Phase 7 adds the social
 * lookups and movements so the group/friend screens and their forms work
 * without a connection.
 */
export type LocalCacheCollection =
  | "wallets"
  | "categories"
  | "transactions"
  | "transfers"
  | "friendships"
  | "friendRequests"
  | "publicProfiles"
  | "groups"
  | "groupInvitations"
  | "sharedExpenses"
  | "settlements"
  | "groupExpenses"
  | "groupSettlements";

/** Sync status carried by every record table (see ADR §4). */
export type LocalRecordSyncStatus =
  | "synced"
  | "pending"
  | "syncing"
  | "failed"
  | "conflict";

export type OutboxEntityType =
  | "wallet"
  | "category"
  | "transaction"
  | "transfer"
  | "shared-expense"
  | "settlement"
  | "group-expense"
  | "group-settlement";

export type OutboxOperation = "create" | "update" | "delete";

export type OutboxStatus = "pending" | "syncing" | "failed" | "conflict";

/** Entity that must be pushed before the mutation can run (offline create). */
export type OutboxDependency = {
  entityType: OutboxEntityType;
  entityId: string;
};

/** One queued mutation as persisted in the `outbox` table. */
export type OutboxMutation = {
  clientMutationId: string;
  ownerId: string;
  seq: number;
  entityType: OutboxEntityType;
  entityId: string;
  operation: OutboxOperation;
  /** Revision the server knows; compared against the remote one before applying. */
  baseRevision: number;
  localSnapshot: Record<string, unknown>;
  serverSnapshot: Record<string, unknown>;
  dependsOn: OutboxDependency[];
  status: OutboxStatus;
  /** Pushes started. A coalesced payload resets it: it is a new mutation. */
  attempts: number;
  nextAttemptAt: string | null;
  lastErrorCode: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * What a local repository hands to the outbox. `seq`, `status`, `attempts` and
 * the audit dates are owned by the repository; `now` is the single time source.
 */
export type OutboxMutationInput = {
  clientMutationId: string;
  ownerId: string;
  entityType: OutboxEntityType;
  entityId: string;
  operation: OutboxOperation;
  baseRevision: number;
  localSnapshot: Record<string, unknown>;
  serverSnapshot?: Record<string, unknown>;
  dependsOn?: OutboxDependency[];
  nextAttemptAt?: string | null;
  lastErrorCode?: string | null;
  now: string;
};

/** Last known sync bookkeeping for one account. Null fields mean "never". */
export type LocalSyncState = {
  ownerId: string;
  lastPullAt: string | null;
  lastPushAt: string | null;
  lastFullSyncAt: string | null;
  lastErrorCode: string | null;
};

/**
 * Stable conflict kinds stored in `conflicts` (ADR §7). They are codes, never
 * user-facing sentences: the UI translates them.
 */
export type LocalConflictKind =
  | "REMOTE_CHANGED"
  | "DELETED_REMOTELY"
  | "WALLET_UNAVAILABLE"
  | "INSUFFICIENT_FUNDS"
  | "INVALID";

/** Explicit user decision that closes a conflict. */
export type LocalConflictResolution = "keep-mine" | "keep-remote";

/** One stopped mutation with both snapshots, kept until the user decides. */
export type LocalConflict = {
  id: string;
  ownerId: string;
  clientMutationId: string;
  entityType: OutboxEntityType;
  entityId: string;
  kind: LocalConflictKind;
  localSnapshot: Record<string, unknown>;
  remoteSnapshot: Record<string, unknown>;
  detectedAt: string;
  resolvedAt: string | null;
  resolution: LocalConflictResolution | null;
};

/** What the sync engine hands to the conflicts repository. */
export type LocalConflictInput = {
  id?: string;
  ownerId: string;
  clientMutationId: string;
  entityType: OutboxEntityType;
  entityId: string;
  kind: LocalConflictKind;
  localSnapshot: Record<string, unknown>;
  remoteSnapshot: Record<string, unknown>;
  detectedAt: string;
};

/** Descriptor of one schema version; statements are DDL only. */
export type LocalDbMigration = {
  version: number;
  statements: readonly string[];
};
