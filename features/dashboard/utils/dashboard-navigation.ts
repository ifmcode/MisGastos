import type { Href } from "expo-router";

export interface DashboardRouter {
  navigate: (href: Href) => void;
  push: (href: Href) => void;
}

export interface DashboardNavigationActions {
  openMovements: () => void;
  openTransferHistory: () => void;
}

/** Keeps dashboard destinations in one place so sections stay presentation-only. */
export function createDashboardNavigationActions(
  router: DashboardRouter,
): DashboardNavigationActions {
  return {
    openMovements: () => router.navigate("/transactions"),
    openTransferHistory: () => router.push("/transfers"),
  };
}
