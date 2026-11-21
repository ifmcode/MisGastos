import { describe, expect, it } from "@jest/globals";

import type { Translate } from "@/shared/i18n/translate";

import {
  getGroupExpenseDetailActionLabels,
  getGroupExpenseDetailDeleteConfirmation,
  getGroupExpenseDetailMissingLabels,
} from "../group-expense-detail-copy";

const t: Translate = (key, options) =>
  options
    ? `${key}|${Object.values(options).map(String).join(",")}`
    : key;

describe("getGroupExpenseDetailActionLabels", () => {
  it("builds the header copy with the description", () => {
    expect(
      getGroupExpenseDetailActionLabels(t, {
        description: "Cena",
        pending: false,
      }),
    ).toEqual({
      close: "common:accessibility.back",
      closeHint: "social:routeBackHint",
      edit: "groupExpenses:actions.editAccessibility|Cena",
      editHint: "groupExpenses:actions.editHint",
      delete: "groupExpenses:actions.deleteAccessibility|Cena",
      deleteHint: "groupExpenses:actions.deleteHint",
    });
  });

  it("explains the delete in flight", () => {
    expect(
      getGroupExpenseDetailActionLabels(t, {
        description: "Cena",
        pending: true,
      }).deleteHint,
    ).toBe("groupExpenses:actions.deletingHint");
  });
});

describe("getGroupExpenseDetailDeleteConfirmation", () => {
  it("interpolates the description", () => {
    expect(getGroupExpenseDetailDeleteConfirmation(t, "Cena")).toEqual({
      title: "groupExpenses:deleteDialog.title",
      message: "groupExpenses:deleteDialog.message|Cena",
    });
  });
});

describe("getGroupExpenseDetailMissingLabels", () => {
  it("fills the safe missing state", () => {
    expect(getGroupExpenseDetailMissingLabels(t)).toEqual({
      title: "groupExpenses:detail.missingTitle",
      message: "groupExpenses:detail.missingMessage",
      close: "groupExpenses:detail.missingAction",
      closeAccessibilityLabel:
        "groupExpenses:detail.missingActionAccessibility",
    });
  });
});
