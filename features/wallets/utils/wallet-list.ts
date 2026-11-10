import { Wallet } from "../types/wallet.types";

/** Replaces the entry matching the updated wallet, preserving list order. */
export function replaceWallet(wallets: Wallet[], updated: Wallet): Wallet[] {
  return wallets.map((wallet) => (wallet.id === updated.id ? updated : wallet));
}
