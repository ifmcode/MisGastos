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
      label: "Transferir",
      accessibilityLabel: "Nueva transferencia",
    });
    expect(actions[1]).toMatchObject({
      label: "Historial de transferencias",
      accessibilityLabel: "Ver historial de transferencias",
    });
  });

  it("keeps the history entry point when a transfer is not possible", () => {
    const actions = getWalletsQuickActions(false);

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      key: "history",
      accessibilityLabel: "Ver historial de transferencias",
    });
  });
});
