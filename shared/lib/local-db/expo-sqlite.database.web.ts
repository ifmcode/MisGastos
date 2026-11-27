import type { DatabasePort } from "./database.port";
import { LOCAL_DB_ERROR_CODES, LocalDbError } from "./local-db.errors";

/**
 * Web is online-only in V1 (TICKET-076): this variant keeps `expo-sqlite` and
 * its WASM worker out of the web bundle. `getLocalDatabase` already returns
 * null on web; this is the build-time guarantee behind that decision.
 */
export async function createExpoSQLiteDatabase(): Promise<DatabasePort> {
  throw new LocalDbError(LOCAL_DB_ERROR_CODES.OPEN_FAILED, {
    cause: new Error("expo-sqlite is not available on web"),
  });
}
