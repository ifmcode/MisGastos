import { getLocalDatabase } from "@/shared/lib/local-db/local-db.runtime";
import { purgeOwnerLocalData } from "@/shared/lib/local-db/owner-purge";
import { revokeOwnerLocalWrites } from "@/shared/lib/local-db/owner-revocation";

/**
 * Drops every local row of one account. The owner's writes are revoked first so
 * a read still in flight cannot repopulate the cache after the delete, then the
 * active sync cycle is awaited and the purge runs in one transaction. The
 * revocation is NOT lifted here: the account that comes back lifts it on login.
 *
 * Returns false when there is no local database (offline-first off or web).
 */
export async function purgeAccountLocalData(
  ownerId: string,
): Promise<boolean> {
  const port = await getLocalDatabase();
  if (!port) return false;

  revokeOwnerLocalWrites(ownerId);

  // Dynamic import: the engine factory loads Firestore, which callers such as
  // the auth factory must not pull in just to purge the local cache.
  const { getSyncEngine } = await import("./sync-engine.factory");
  await getSyncEngine().whenIdle(ownerId);

  await purgeOwnerLocalData(port, ownerId);
  return true;
}

/**
 * Logout wrapper: best effort, never blocks or fails the sign-out. The purge
 * runs after a successful `signOut`, when the session is already gone, and the
 * revocation stays until the account signs in again.
 */
export async function purgeLocalAccountOnLogout(
  ownerId: string | null,
): Promise<void> {
  if (!ownerId) return;

  try {
    await purgeAccountLocalData(ownerId);
  } catch {
    console.warn("[local-db] OWNER_PURGE_FAILED");
  }
}
