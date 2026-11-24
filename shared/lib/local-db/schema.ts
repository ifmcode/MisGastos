import { MIGRATION_001_STATEMENTS } from "./migrations/migration-001.statements";
import {
  SCHEMA_INDEX_STATEMENTS,
  SCHEMA_TABLE_STATEMENTS,
} from "./schema.tables";

export {
  LOCAL_DB_PRIMARY_KEYS,
  LOCAL_DB_UNIQUE_KEYS,
} from "./schema.keys";

/**
 * Frozen version 1 DDL. Kept for the migration contract: migrations are
 * append-only, so this snapshot must never change as the schema evolves.
 */
export { MIGRATION_001_STATEMENTS as SCHEMA_V1_STATEMENTS };

/** Everything the current schema version creates: tables first, then indexes. */
export const SCHEMA_CURRENT_STATEMENTS: readonly string[] = [
  ...SCHEMA_TABLE_STATEMENTS,
  ...SCHEMA_INDEX_STATEMENTS,
];
