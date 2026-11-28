import type { LocalDbMigration } from "../local-db.types";
import { MIGRATION_001 } from "./migration-001";
import { MIGRATION_002 } from "./migration-002";
import { MIGRATION_003 } from "./migration-003";
import { MIGRATION_004 } from "./migration-004";

export type { LocalDbMigration } from "../local-db.types";

/** Every migration, ordered by version. Append; never reorder or edit. */
export const LOCAL_DB_MIGRATIONS: readonly LocalDbMigration[] = [
  MIGRATION_001,
  MIGRATION_002,
  MIGRATION_003,
  MIGRATION_004,
];

export const LATEST_SCHEMA_VERSION = LOCAL_DB_MIGRATIONS.reduce(
  (latest, migration) => Math.max(latest, migration.version),
  0,
);
