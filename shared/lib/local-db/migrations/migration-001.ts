import type { LocalDbMigration } from "../local-db.types";
import { SCHEMA_V1_STATEMENTS } from "../schema";

/** Version 1: wallets, categories, transactions, transfers, outbox, conflicts. */
export const MIGRATION_001: LocalDbMigration = {
  version: 1,
  statements: SCHEMA_V1_STATEMENTS,
};
