import type { LocalDbMigration } from "../local-db.types";
import { MIGRATION_001_STATEMENTS } from "./migration-001.statements";

/** Version 1: wallets, categories, transactions, transfers, outbox, conflicts. */
export const MIGRATION_001: LocalDbMigration = {
  version: 1,
  statements: MIGRATION_001_STATEMENTS,
};
