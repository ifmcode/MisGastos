export type DashboardRefreshAction = () => Promise<void> | void;

export interface DashboardRefreshSources {
  wallets: DashboardRefreshAction;
  transfers: DashboardRefreshAction;
  transactions: DashboardRefreshAction;
}

/**
 * Refreshes the dashboard collections without swapping the screen: the hooks
 * keep the current content visible while they reload in the background.
 */
export function refreshDashboardSources(sources: DashboardRefreshSources): void {
  void sources.wallets();
  void sources.transfers();
  void sources.transactions();
}
