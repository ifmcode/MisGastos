import { useMemo } from "react";

import { Transfer } from "@/features/transfers/types/transfer.types";
import { canTransferBetweenWallets } from "@/features/transfers/utils/transfer-wallets";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { WalletTotal } from "@/features/wallets/utils/money";

import {
  getDashboardTotals,
  getVisibleWallets,
} from "../utils/dashboard-summary";

const RECENT_TRANSFERS_LIMIT = 3;

export interface DashboardOverview {
  effectiveSelectedWalletId: string;
  selectedWallet: Wallet | null;
  totals: WalletTotal[];
  visibleWallets: Wallet[];
  walletMap: ReadonlyMap<string, Wallet>;
  recentTransfers: Transfer[];
  canTransfer: boolean;
}

/**
 * Derives everything the dashboard renders from the raw wallet/transfer lists.
 * Keeps the screen free of memoization details.
 */
export function useDashboardOverview(
  wallets: readonly Wallet[],
  transfers: readonly Transfer[],
  selectedWalletId: string,
): DashboardOverview {
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

  const visibleWallets = useMemo(
    () => getVisibleWallets(wallets, effectiveSelectedWalletId),
    [wallets, effectiveSelectedWalletId],
  );

  const walletMap = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet])),
    [wallets],
  );

  const recentTransfers = useMemo(
    () => transfers.slice(0, RECENT_TRANSFERS_LIMIT),
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
    visibleWallets,
    walletMap,
    recentTransfers,
    canTransfer,
  };
}
