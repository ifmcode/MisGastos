/**
 * Stable code for a list read the Firestore SDK served from its local cache.
 * Callers treat it as a load failure, never as server truth.
 */
export const OFFLINE_READ_CODE = "OFFLINE_READ";

export class OfflineReadError extends Error {
  readonly code = OFFLINE_READ_CODE;

  constructor() {
    super(OFFLINE_READ_CODE);
    this.name = "OfflineReadError";
  }
}

/**
 * Rejects a snapshot the SDK served from its local cache **and** that carries no
 * documents. That is the dangerous case: on a cold start without connection it
 * looks like "the server has nothing", so mirroring it would delete the read
 * cache and paint an empty list even though the device holds the last known
 * data. A cached snapshot with documents is the last known server state and can
 * be used normally.
 */
export function assertServerSnapshot(snapshot: {
  metadata?: { fromCache?: boolean };
  size?: number;
}): void {
  const fromCache = snapshot.metadata?.fromCache === true;
  const isEmpty = (snapshot.size ?? 0) === 0;

  if (fromCache && isEmpty) throw new OfflineReadError();
}
