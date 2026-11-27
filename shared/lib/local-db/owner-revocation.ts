/**
 * Accounts whose local writes are blocked. Signing out revokes the owner before
 * the purge, so a remote read that started earlier and finishes later cannot
 * mirror its rows back into the cache: `cache-mirror` turns into a no-op while
 * the owner stays revoked. The block is lifted when the account signs in again.
 */
const revokedOwners = new Set<string>();

export function revokeOwnerLocalWrites(ownerId: string): void {
  revokedOwners.add(ownerId);
}

export function allowOwnerLocalWrites(ownerId: string): void {
  revokedOwners.delete(ownerId);
}

export function isOwnerLocalWritesRevoked(ownerId: string): boolean {
  return revokedOwners.has(ownerId);
}
