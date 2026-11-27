import type { LocalDbMigration } from "../local-db.types";

/**
 * Version 3: the social read cache and the local movement tables that back the
 * offline group/friend writes. Friendships, requests, profiles, groups and
 * invitations are cache-only (their management stays online); the four movement
 * tables carry `revision`, `deletedAt` and `syncStatus` like the personal ones.
 */
export const MIGRATION_003: LocalDbMigration = {
  version: 3,
  statements: [
    `CREATE TABLE IF NOT EXISTS friendships (
      id TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      memberIds TEXT NOT NULL,
      requesterId TEXT NOT NULL,
      recipientId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncStatus TEXT NOT NULL DEFAULT 'synced'
      PRIMARY KEY (ownerId, id)
    )`,
    `CREATE TABLE IF NOT EXISTS friendRequests (
      id TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      requesterId TEXT NOT NULL,
      recipientId TEXT NOT NULL,
      participantIds TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncStatus TEXT NOT NULL DEFAULT 'synced'
      PRIMARY KEY (ownerId, id)
    )`,
    `CREATE TABLE IF NOT EXISTS publicProfiles (
      id TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      displayName TEXT,
      email TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncStatus TEXT NOT NULL DEFAULT 'synced'
      PRIMARY KEY (ownerId, id)
    )`,
    `CREATE TABLE IF NOT EXISTS groups (
      id TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      groupOwnerId TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      memberIds TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      defaultCurrency TEXT NOT NULL,
      joinCode TEXT,
      simplifyDebts INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncStatus TEXT NOT NULL DEFAULT 'synced'
      PRIMARY KEY (ownerId, id)
    )`,
    `CREATE TABLE IF NOT EXISTS groupInvitations (
      id TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      groupId TEXT NOT NULL,
      groupName TEXT NOT NULL,
      inviterId TEXT NOT NULL,
      inviteeId TEXT NOT NULL,
      pairId TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncStatus TEXT NOT NULL DEFAULT 'synced'
      PRIMARY KEY (ownerId, id)
    )`,
    `CREATE TABLE IF NOT EXISTS sharedExpenses (
      id TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      participantIds TEXT NOT NULL,
      pairId TEXT NOT NULL,
      payerId TEXT NOT NULL,
      amountCents INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL,
      splitMode TEXT NOT NULL,
      participants TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      walletId TEXT,
      categoryId TEXT,
      linkedTransactionId TEXT,
      createdBy TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT,
      revision INTEGER NOT NULL DEFAULT 0,
      syncStatus TEXT NOT NULL DEFAULT 'synced'
      PRIMARY KEY (ownerId, id)
    )`,
    `CREATE TABLE IF NOT EXISTS settlements (
      id TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      participantIds TEXT NOT NULL,
      pairId TEXT NOT NULL,
      fromUserId TEXT NOT NULL,
      toUserId TEXT NOT NULL,
      amountCents INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT,
      receiverWalletId TEXT,
      receiverCategoryId TEXT,
      receiverTransactionId TEXT,
      revision INTEGER NOT NULL DEFAULT 0,
      syncStatus TEXT NOT NULL DEFAULT 'synced'
      PRIMARY KEY (ownerId, id)
    )`,
    `CREATE TABLE IF NOT EXISTS groupExpenses (
      id TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      groupId TEXT NOT NULL,
      payerId TEXT NOT NULL,
      amountCents INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL,
      splitMode TEXT NOT NULL,
      participants TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      walletId TEXT,
      categoryId TEXT,
      linkedTransactionId TEXT,
      createdBy TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT,
      revision INTEGER NOT NULL DEFAULT 0,
      syncStatus TEXT NOT NULL DEFAULT 'synced'
      PRIMARY KEY (ownerId, id)
    )`,
    `CREATE TABLE IF NOT EXISTS groupSettlements (
      id TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      groupId TEXT NOT NULL,
      participantIds TEXT NOT NULL,
      pairId TEXT NOT NULL,
      fromUserId TEXT NOT NULL,
      toUserId TEXT NOT NULL,
      amountCents INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT,
      receiverWalletId TEXT,
      receiverCategoryId TEXT,
      receiverTransactionId TEXT,
      revision INTEGER NOT NULL DEFAULT 0,
      syncStatus TEXT NOT NULL DEFAULT 'synced'
      PRIMARY KEY (ownerId, id)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_shared_expenses_owner
      ON sharedExpenses (ownerId)`,
    `CREATE INDEX IF NOT EXISTS idx_settlements_owner
      ON settlements (ownerId)`,
    `CREATE INDEX IF NOT EXISTS idx_group_expenses_owner_group
      ON groupExpenses (ownerId, groupId)`,
    `CREATE INDEX IF NOT EXISTS idx_group_settlements_owner_group
      ON groupSettlements (ownerId, groupId)`,
    `CREATE INDEX IF NOT EXISTS idx_friendships_owner
      ON friendships (ownerId)`,
    `CREATE INDEX IF NOT EXISTS idx_friend_requests_owner
      ON friendRequests (ownerId)`,
    `CREATE INDEX IF NOT EXISTS idx_groups_owner ON groups (ownerId)`,
    `CREATE INDEX IF NOT EXISTS idx_group_invitations_owner
      ON groupInvitations (ownerId)`,
  ],
};
