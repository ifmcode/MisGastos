import { describe, expect, it } from "@jest/globals";

import { getWalletsQuickActions } from "../wallets-quick-actions";

describe("getWalletsQuickActions", () => {
  it("offers transfer first and history second when a transfer is possible", () => {
    const actions = getWalletsQuickActions(true);

    expect(actions.map((action) => action.key)).toEqual([
      "transfer",
      "history",
    ]);
    expect(actions[0]).toMatchObject({
      labelKey: "quick.transfer",
      accessibilityKey: "quick.transferAccessibility",
    });
    expect(actions[1]).toMatchObject({
      labelKey: "quick.history",
      accessibilityKey: "quick.historyAccessibility",
    });
  });

  it("keeps the history entry point when a transfer is not possible", () => {
    const actions = getWalletsQuickActions(false);

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      key: "history",
      accessibilityKey: "quick.historyAccessibility",
    });
  });
});
