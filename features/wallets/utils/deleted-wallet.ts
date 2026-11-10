/**
 * Movements whose wallet was permanently deleted keep a virtual wallet id so
 * their history stays visible without affecting any real wallet balance.
 */
export const ORPHANED_WALLET_ID = "-1";

export const DELETED_WALLET_NAME_PREFIX = "[Eliminada]";

export function isOrphanedWalletId(walletId: string): boolean {
  return walletId.trim() === ORPHANED_WALLET_ID;
}

/** Prefixes a wallet name once so repeated deletions stay readable. */
export function getDeletedWalletName(name: string): string {
  const trimmed = name.trim();

  if (trimmed.startsWith(DELETED_WALLET_NAME_PREFIX)) {
    return trimmed;
  }

  return `${DELETED_WALLET_NAME_PREFIX} ${trimmed}`;
}
