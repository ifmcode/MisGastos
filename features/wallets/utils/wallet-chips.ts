import { Wallet } from "../types/wallet.types";

/** Maximum number of wallet chips shown inline before the `+` action. */
export const COMPACT_WALLET_LIMIT = 3;

export interface WalletChips {
  /** Chips rendered inline. The selected wallet always leads the list. */
  visible: readonly Wallet[];
  /** Wallets that only appear inside the picker popup. */
  hidden: readonly Wallet[];
}

/**
 * Builds the compact wallet chips. The selected wallet moves to the front so it
 * stays visible even when the collection is longer than the limit. The full
 * list must still be passed to the popup, which never filters again.
 */
export function getWalletChips(
  wallets: readonly Wallet[],
  selectedId: string,
  limit: number = COMPACT_WALLET_LIMIT,
): WalletChips {
  const selected = wallets.find((wallet) => wallet.id === selectedId);
  const ordered = selected
    ? [selected, ...wallets.filter((wallet) => wallet.id !== selected.id)]
    : [...wallets];
  const visibleLimit = Math.max(0, limit);

  return {
    visible: ordered.slice(0, visibleLimit),
    hidden: ordered.slice(visibleLimit),
  };
}
