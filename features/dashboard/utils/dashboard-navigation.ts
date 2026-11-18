import type { Href } from "expo-router";

export interface DashboardRouter {
  navigate: (href: Href) => void;
  push: (href: Href) => void;
}

export interface DashboardNavigationActions {
  openMovements: () => void;
  openTransferHistory: () => void;
  /** A linked movement opens its shared expense, never the personal detail. */
  openSharedExpense: (expenseId: string) => void;
  /** A settlement income opens its settlement detail, never the personal one. */
  openSettlement: (settlementId: string) => void;
}

/** Keeps dashboard destinations in one place so sections stay presentation-only. */
export function createDashboardNavigationActions(
  router: DashboardRouter,
): DashboardNavigationActions {
  return {
    openMovements: () => router.navigate("/transactions"),
    openTransferHistory: () => router.push("/transfers"),
    openSharedExpense: (expenseId) =>
      router.push(`/social/expenses/${expenseId}` as Href),
    openSettlement: (settlementId) =>
      router.push(`/social/settlements/${settlementId}` as Href),
  };
}
