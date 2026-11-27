import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";

import { refreshDashboardSources } from "../utils/dashboard-refresh";

export interface DashboardRefreshSource {
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
}

export interface UseDashboardRefreshOptions {
  wallets: DashboardRefreshSource;
  transfers: DashboardRefreshSource;
  transactions: DashboardRefreshSource;
}

export interface DashboardRefresh {
  /** Retries the recent-movements load after an inline error. */
  retryMovements: () => void;
}

/**
 * Keeps the dashboard data fresh. Movements, transfers and wallets are created
 * in other tabs, so they refresh when the screen regains focus; the first focus
 * is skipped because the hooks already load on mount.
 */
export function useDashboardRefresh({
  wallets,
  transfers,
  transactions,
}: UseDashboardRefreshOptions): DashboardRefresh {
  const hasFocusedOnce = useRef(false);

  const { refresh: refreshWallets } = wallets;
  const { refresh: refreshTransfers } = transfers;
  const { refresh: refreshTransactions, reload: reloadTransactions } =
    transactions;

  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }

      refreshDashboardSources({
        wallets: refreshWallets,
        transfers: refreshTransfers,
        transactions: refreshTransactions,
      });
    }, [refreshWallets, refreshTransfers, refreshTransactions]),
  );

  const retryMovements = useCallback(() => {
    void reloadTransactions();
  }, [reloadTransactions]);

  return { retryMovements };
}
