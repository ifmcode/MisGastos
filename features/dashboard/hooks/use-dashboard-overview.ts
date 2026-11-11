import { useMemo } from "react";

import { Transaction } from "@/features/transactions/types/transaction.types";
import { Transfer } from "@/features/transfers/types/transfer.types";
import { canTransferBetweenWallets } from "@/features/transfers/utils/transfer-wallets";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { WalletTotal } from "@/features/wallets/utils/money";

import { getDashboardTotals } from "../utils/dashboard-summary";
import {
  getRecentMovements,
  getRecentTransfers,
} from "../utils/dashboard-recent";

export interface DashboardOverviewParams {
  wallets: readonly Wallet[];
  allWallets?: readonly Wallet[];
  transfers: readonly Transfer[];
  transactions: readonly Transaction[];
  selectedWalletId: string;
}

export interface DashboardOverview {
  effectiveSelectedWalletId: string;
  selectedWallet: Wallet | null;
  totals: WalletTotal[];
  walletMap: ReadonlyMap<string, Wallet>;
  recentMovements: Transaction[];
  hasMoreMovements: boolean;
  recentTransfers: Transfer[];
  hasMoreTransfers: boolean;
  canTransfer: boolean;
}

/**
 * Derives everything the dashboard renders from the raw collections.
 * Keeps the screen free of memoization and capping details.
 */
export function useDashboardOverview({
  wallets,
  allWallets = wallets,
  transfers,
  transactions,
  selectedWalletId,
}: DashboardOverviewParams): DashboardOverview {
  const effectiveSelectedWalletId = wallets.some(
    (wallet) => wallet.id === selectedWalletId,
  )
    ? selectedWalletId
    : "";

  const selectedWallet = useMemo(
    () =>
      wallets.find((wallet) => wallet.id === effectiveSelectedWalletId) ?? null,
    [wallets, effectiveSelectedWalletId],
  );

  const totals = useMemo(
    () => getDashboardTotals(wallets, effectiveSelectedWalletId),
    [wallets, effectiveSelectedWalletId],
  );

  const walletMap = useMemo(
    () => new Map(allWallets.map((wallet) => [wallet.id, wallet])),
    [allWallets],
  );

  const recentMovements = useMemo(
    () => getRecentMovements(transactions),
    [transactions],
  );

  const recentTransfers = useMemo(
    () => getRecentTransfers(transfers),
    [transfers],
  );

  const canTransfer = useMemo(
    () => canTransferBetweenWallets(wallets),
    [wallets],
  );

  return {
    effectiveSelectedWalletId,
    selectedWallet,
    totals,
    walletMap,
    recentMovements: recentMovements.items,
    hasMoreMovements: recentMovements.hasMore,
    recentTransfers: recentTransfers.items,
    hasMoreTransfers: recentTransfers.hasMore,
    canTransfer,
  };
}
