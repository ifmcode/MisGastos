import { describe, expect, it } from "@jest/globals";

import { resources } from "@/shared/i18n/resources";

describe("transfer card accessibility copy", () => {
  it("announces the detail action from the dashboard and the history", () => {
    // The dashboard and `/transfers` both pass `labelKind="detail"`, so the
    // card must expose both the detail hint and the detail label copy.
    for (const locale of [resources.es, resources.en]) {
      expect(locale.transfers.item).toHaveProperty("detailHint");
      expect(locale.transfers.item).toHaveProperty("detailLabel");
    }
  });

  it("keeps the edit hint for the shared card fallback label", () => {
    for (const locale of [resources.es, resources.en]) {
      expect(locale.transfers.item).toHaveProperty("editHint");
    }
  });
});
