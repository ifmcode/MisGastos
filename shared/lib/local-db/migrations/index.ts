import type { LocalDbMigration } from "../local-db.types";
import { MIGRATION_001 } from "./migration-001";

export type { LocalDbMigration } from "../local-db.types";

/** Every migration, ordered by version. Append; never reorder or edit. */
export const LOCAL_DB_MIGRATIONS: readonly LocalDbMigration[] = [MIGRATION_001];

export const LATEST_SCHEMA_VERSION = LOCAL_DB_MIGRATIONS.reduce(
  (latest, migration) => Math.max(latest, migration.version),
  0,
);
