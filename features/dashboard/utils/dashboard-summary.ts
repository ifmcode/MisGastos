import { Wallet } from "@/features/wallets/types/wallet.types";
import { calculateWalletTotals, WalletTotal } from "@/features/wallets/utils/money";

/**
 * The dashboard can show the global total or a single wallet. Global totals
 * only include wallets marked with includeInTotal; selecting a specific wallet
 * always shows its real balance, even when it is excluded from the global total.
 */
export function getDashboardTotals(
  wallets: readonly Wallet[],
  selectedWalletId: string,
): WalletTotal[] {
  if (selectedWalletId.length === 0) {
    return calculateWalletTotals(wallets);
  }

  const selectedWallet = wallets.find(
    (wallet) => wallet.id === selectedWalletId,
  );

  if (!selectedWallet) return [];

  return [
    { currency: selectedWallet.currency, total: selectedWallet.balance },
  ];
}

export function getVisibleWallets(
  wallets: readonly Wallet[],
  selectedWalletId: string,
): Wallet[] {
  if (selectedWalletId.length === 0) return [...wallets];

  return wallets.filter((wallet) => wallet.id === selectedWalletId);
}
