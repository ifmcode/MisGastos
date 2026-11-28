import type { LocalDbMigration } from "../local-db.types";

/**
 * Version 4: the owner-chosen wallet position. Nullable on purpose: wallets
 * written before this version (and any create that does not reorder yet) keep
 * their legacy `createdAt` order until the owner reorders them.
 */
export const MIGRATION_004: LocalDbMigration = {
  version: 4,
  statements: [`ALTER TABLE wallets ADD COLUMN sortOrder INTEGER`],
};
