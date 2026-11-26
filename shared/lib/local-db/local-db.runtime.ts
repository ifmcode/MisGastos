import type { DatabasePort } from "./database.port";
import { migrateLocalDatabase } from "./database";
import { LOCAL_DB_ERROR_CODES, LocalDbError } from "./local-db.errors";
import { isOfflineFirstEnabled } from "./offline-first.flag";
import { createSerializedDatabasePort } from "./serialized.database";

export type LocalDatabaseOpener = () => Promise<DatabasePort>;

type PortOverride = { port: DatabasePort | null };

let override: PortOverride | null = null;
let opening: Promise<DatabasePort | null> | null = null;

/**
 * Test seam. Injects a port (for `InMemoryDatabase`) or, with `null`, forces
 * "no local database" without touching the native module. `resetLocalDatabasePort`
 * restores the real factory.
 */
export function setLocalDatabasePort(port: DatabasePort | null): void {
  override = { port };
  opening = null;
}

export function resetLocalDatabasePort(): void {
  override = null;
  opening = null;
}

/**
 * The local database for the read cache, or null when the feature is off, no
 * open port is available, or opening/migrating failed. Successful opens are
 * memoized; failures are not, so a later call can retry.
 */
export async function getLocalDatabase(): Promise<DatabasePort | null> {
  if (override) return override.port;
  if (!isOfflineFirstEnabled()) return null;

  if (!opening) {
    // Every transaction of every caller (read cache, offline writes, sync
    // engine) goes through one port, so they must not run concurrently.
    opening = openLocalDatabasePort(openExpoSQLiteDatabase).then((port) =>
      port ? createSerializedDatabasePort(port) : null,
    );
  }

  const port = await opening;
  if (!port) opening = null;

  return port;
}

/**
 * Opens and migrates a database through the supplied opener. Returns null and
 * logs only the stable error code when the native module or a migration fails,
 * so callers fall back to the remote path instead of crashing.
 *
 * Exposed for tests: production passes the dynamic `expo-sqlite` loader below.
 */
export async function openLocalDatabasePort(
  open: LocalDatabaseOpener,
): Promise<DatabasePort | null> {
  let port: DatabasePort | null = null;

  try {
    port = await open();
    await migrateLocalDatabase(port);
    return port;
  } catch (error) {
    if (port) await closeQuietly(port);
    logRuntimeFailure(error);
    return null;
  }
}

async function closeQuietly(port: DatabasePort): Promise<void> {
  try {
    await port.close();
  } catch {
    // The original failure is the one that matters; nothing else to release.
  }
}

function logRuntimeFailure(error: unknown): void {
  const code =
    error instanceof LocalDbError
      ? error.code
      : LOCAL_DB_ERROR_CODES.OPEN_FAILED;

  console.warn(`[local-db] ${code}`);
}

/**
 * The only reference to `expo-sqlite`: a dynamic import keeps the native module
 * out of Jest and out of the bundle until the read cache is actually enabled.
 */
async function openExpoSQLiteDatabase(): Promise<DatabasePort> {
  const { createExpoSQLiteDatabase } = await import("./expo-sqlite.database");
  return createExpoSQLiteDatabase();
}
