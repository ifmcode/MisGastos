import { Wallet } from "@/features/wallets/types/wallet.types";

/**
 * A transfer needs two different wallets sharing a currency because the MVP
 * does not convert between currencies.
 */
export function canTransferBetweenWallets(
  wallets: readonly Wallet[],
): boolean {
  const currencies = new Set<string>();

  for (const wallet of wallets) {
    if (currencies.has(wallet.currency)) return true;
    currencies.add(wallet.currency);
  }

  return false;
}
