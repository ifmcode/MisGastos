import { openDatabaseAsync } from "expo-sqlite";

import type { DatabasePort } from "./database.port";
import { createSQLiteDatabasePort } from "./sqlite-port";

/**
 * Opens (or creates) the single app database file and returns the port. This is
 * the only module allowed to import `expo-sqlite`: everything else depends on
 * `DatabasePort`, which keeps Jest free of native modules.
 */
export async function createExpoSQLiteDatabase(
  databaseName = "misgastos.db",
): Promise<DatabasePort> {
  const connection = await openDatabaseAsync(databaseName);

  return createSQLiteDatabasePort(connection);
}
