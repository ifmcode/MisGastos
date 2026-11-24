import type { DatabasePort } from "./database.port";
import { LOCAL_DB_ERROR_CODES, LocalDbError } from "./local-db.errors";
import { LATEST_SCHEMA_VERSION, LOCAL_DB_MIGRATIONS } from "./migrations";

/**
 * Brings the local database to `LATEST_SCHEMA_VERSION` and returns how many
 * migrations were applied. Idempotent: a second call applies nothing.
 *
 * DDL and the version write commit together in one transaction, so a failure
 * leaves the previous version intact. A database written by a newer binary is
 * rejected instead of being read with missing columns.
 */
export async function migrateLocalDatabase(
  port: DatabasePort,
): Promise<number> {
  const currentVersion = await port.getSchemaVersion();

  if (currentVersion > LATEST_SCHEMA_VERSION) {
    throw new LocalDbError(LOCAL_DB_ERROR_CODES.SCHEMA_NEWER);
  }

  const pending = LOCAL_DB_MIGRATIONS.filter(
    (migration) => migration.version > currentVersion,
  );

  if (pending.length === 0) return 0;

  try {
    await port.transaction(async (tx) => {
      for (const migration of pending) {
        await tx.executeStatements(migration.statements);
      }

      await tx.setSchemaVersion(LATEST_SCHEMA_VERSION);
    });
  } catch (cause) {
    throw new LocalDbError(LOCAL_DB_ERROR_CODES.MIGRATION_FAILED, { cause });
  }

  return pending.length;
}
