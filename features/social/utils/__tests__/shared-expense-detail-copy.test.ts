import { describe, expect, it } from "@jest/globals";

import type { Translate } from "@/shared/i18n/translate";

import {
  getSharedExpenseDetailActionLabels,
  getSharedExpenseDetailDeleteConfirmation,
  getSharedExpenseDetailMissingLabels,
} from "../shared-expense-detail-copy";

/** Deterministic fake: the key stays visible and options are appended. */
const t: Translate = (key, options) =>
  options ? `${key}:${Object.values(options).join("/")}` : key;

describe("getSharedExpenseDetailActionLabels", () => {
  it("reuses the row copy for edit and delete plus the route back hint", () => {
    expect(
      getSharedExpenseDetailActionLabels(t, {
        description: "Dinner",
        pending: false,
      }),
    ).toEqual({
      close: "common:accessibility.back",
      closeHint: "social:routeBackHint",
      edit: "sharedExpenses:row.editAccessibility:Dinner",
      editHint: "sharedExpenses:row.editHint",
      delete: "sharedExpenses:row.deleteAccessibility:Dinner",
      deleteHint: "sharedExpenses:row.deleteHint",
    });
  });

  it("explains the deletion while one is in flight", () => {
    expect(
      getSharedExpenseDetailActionLabels(t, {
        description: "Dinner",
        pending: true,
      }).deleteHint,
    ).toBe("sharedExpenses:row.deletingHint");
  });
});

describe("getSharedExpenseDetailDeleteConfirmation", () => {
  it("reuses the shared delete dialog copy with the description", () => {
    expect(getSharedExpenseDetailDeleteConfirmation(t, "Dinner")).toEqual({
      title: "sharedExpenses:deleteDialog.title",
      message: "sharedExpenses:deleteDialog.message:Dinner",
    });
  });
});

describe("getSharedExpenseDetailMissingLabels", () => {
  it("describes the safe missing state with a way back", () => {
    expect(getSharedExpenseDetailMissingLabels(t)).toEqual({
      title: "sharedExpenses:detail.missingTitle",
      message: "sharedExpenses:detail.missingMessage",
      close: "sharedExpenses:detail.missingAction",
      closeAccessibilityLabel:
        "sharedExpenses:detail.missingActionAccessibility",
    });
  });
});
