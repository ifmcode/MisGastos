export type DashboardRefreshAction = () => Promise<void> | void;

export interface DashboardRefreshSources {
  wallets: DashboardRefreshAction;
  transfers: DashboardRefreshAction;
  transactions: DashboardRefreshAction;
  /** Categories only refresh on pull-to-refresh, never when the tab refocuses. */
  categories?: DashboardRefreshAction;
}

/**
 * Refreshes the dashboard collections without swapping the screen: the hooks
 * keep the current content visible and only toggle their refresh flags.
 */
export function refreshDashboardSources(sources: DashboardRefreshSources): void {
  void sources.wallets();
  void sources.transfers();
  void sources.transactions();

  if (sources.categories) void sources.categories();
}
