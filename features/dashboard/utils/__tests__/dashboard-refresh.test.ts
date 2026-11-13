import { describe, expect, it, jest } from "@jest/globals";

import { refreshDashboardSources } from "../dashboard-refresh";

function createBaseSources() {
  return {
    wallets: jest.fn<() => void>(),
    transfers: jest.fn<() => void>(),
    transactions: jest.fn<() => void>(),
  };
}

describe("refreshDashboardSources", () => {
  it("refreshes wallets, transfers and movements when the tab refocuses", () => {
    const sources = createBaseSources();

    refreshDashboardSources(sources);

    expect(sources.wallets).toHaveBeenCalledTimes(1);
    expect(sources.transfers).toHaveBeenCalledTimes(1);
    expect(sources.transactions).toHaveBeenCalledTimes(1);
  });

  it("also refreshes categories on pull-to-refresh", () => {
    const sources = createBaseSources();
    const categories = jest.fn<() => void>();

    refreshDashboardSources({ ...sources, categories });

    expect(categories).toHaveBeenCalledTimes(1);
    expect(sources.transactions).toHaveBeenCalledTimes(1);
  });

  it("accepts sources that return a promise", () => {
    const wallets = jest.fn<() => Promise<void>>(async () => undefined);
    const transfers = jest.fn<() => Promise<void>>(async () => undefined);
    const transactions = jest.fn<() => Promise<void>>(async () => undefined);

    expect(() =>
      refreshDashboardSources({ wallets, transfers, transactions }),
    ).not.toThrow();
    expect(transactions).toHaveBeenCalledTimes(1);
  });
});
