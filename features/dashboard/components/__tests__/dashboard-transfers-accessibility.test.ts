import { describe, expect, it } from "@jest/globals";

import { resources } from "@/shared/i18n/resources";

describe("dashboard transfer cards", () => {
  it("announces the transfer detail instead of the edit form", () => {
    // `DashboardTransfersSection` passes the detail hint and label kind, so the
    // card must expose both the detail hint and the detail label copy.
    for (const locale of [resources.es, resources.en]) {
      expect(locale.transfers.item).toHaveProperty("detailHint");
      expect(locale.transfers.item).toHaveProperty("detailLabel");
    }
  });

  it("keeps the edit hint for the /transfers history rows", () => {
    for (const locale of [resources.es, resources.en]) {
      expect(locale.transfers.item).toHaveProperty("editHint");
    }
  });
});
