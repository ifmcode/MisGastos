import { describe, expect, it } from "@jest/globals";

import { resources } from "@/shared/i18n/resources";

describe("dashboard movement cards", () => {
  it("keeps the movement detail hint in the transactions namespace", () => {
    // `TransactionItem` falls back to OPEN_TRANSACTION_DETAIL_HINT_KEY, so the
    // dashboard must not override it with a tab-navigation hint.
    expect(resources.es.transactions.accessibility).toHaveProperty(
      "openDetailHint",
    );
    expect(resources.en.transactions.accessibility).toHaveProperty(
      "openDetailHint",
    );
  });

  it("no longer keeps the old Movimientos tab hint", () => {
    expect(resources.es.dashboard.movements).not.toHaveProperty(
      "openHistoryHint",
    );
    expect(resources.en.dashboard.movements).not.toHaveProperty(
      "openHistoryHint",
    );
  });
});
