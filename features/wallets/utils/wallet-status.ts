import { Wallet } from "../types/wallet.types";

export function isWalletArchived(wallet: Wallet): boolean {
  return Boolean(wallet.archivedAt);
}

export function isWalletActive(wallet: Wallet): boolean {
  return !wallet.archivedAt;
}

/** Wallets available for new movements, transfers, filters and totals. */
export function getActiveWallets(wallets: readonly Wallet[]): Wallet[] {
  return wallets.filter(isWalletActive);
}

export function getArchivedWallets(wallets: readonly Wallet[]): Wallet[] {
  return wallets.filter(isWalletArchived);
}
