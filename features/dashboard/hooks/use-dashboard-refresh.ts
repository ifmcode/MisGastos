import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";

import { refreshDashboardSources } from "../utils/dashboard-refresh";

export interface DashboardRefreshSource {
  refreshing: boolean;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
}

export interface UseDashboardRefreshOptions {
  wallets: DashboardRefreshSource;
  transfers: DashboardRefreshSource;
  transactions: DashboardRefreshSource;
  categories: DashboardRefreshSource;
}

export interface DashboardRefresh {
  /** Any collection refreshing, used by the pull-to-refresh spinner. */
  refreshing: boolean;
  /** Reloads every collection, categories included. */
  refreshAll: () => void;
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
  categories,
}: UseDashboardRefreshOptions): DashboardRefresh {
  const hasFocusedOnce = useRef(false);

  const { refresh: refreshWallets, refreshing: walletsRefreshing } = wallets;
  const { refresh: refreshTransfers, refreshing: transfersRefreshing } =
    transfers;
  const {
    refresh: refreshTransactions,
    reload: reloadTransactions,
    refreshing: transactionsRefreshing,
  } = transactions;
  const {
    refresh: refreshCategories,
    reload: reloadCategories,
    refreshing: categoriesRefreshing,
  } = categories;

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

  const refreshAll = useCallback(() => {
    refreshDashboardSources({
      wallets: refreshWallets,
      transfers: refreshTransfers,
      transactions: refreshTransactions,
      categories: refreshCategories,
    });
  }, [
    refreshWallets,
    refreshTransfers,
    refreshTransactions,
    refreshCategories,
  ]);

  const retryMovements = useCallback(() => {
    void reloadTransactions();
    void reloadCategories();
  }, [reloadTransactions, reloadCategories]);

  return {
    refreshing:
      walletsRefreshing ||
      transfersRefreshing ||
      transactionsRefreshing ||
      categoriesRefreshing,
    refreshAll,
    retryMovements,
  };
}
