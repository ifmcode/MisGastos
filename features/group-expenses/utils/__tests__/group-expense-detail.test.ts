import { describe, expect, it } from "@jest/globals";

import type { CurrencyCode } from "@/shared/constants/currencies";
import type { Translate } from "@/shared/i18n/translate";

import type { GroupExpenseDetailContext } from "../group-expense-detail.types";
import {
  findGroupExpenseForDetail,
  getGroupExpenseDetailSummary,
  getGroupExpensePayerLabel,
  getGroupExpenseSplitModeLabel,
} from "../group-expense-detail";
import { buildExpense, buildMembers, VIEWER } from "./group-expense-ui.test-helpers";

const t: Translate = (key, options) =>
  options
    ? `${key}|${Object.values(options).map(String).join(",")}`
    : key;

const formatCurrency = (value: number, currency: CurrencyCode) =>
  `${value.toFixed(2)} ${currency}`;

const context: GroupExpenseDetailContext = {
  viewerUid: VIEWER,
  members: buildMembers(),
  formatCurrency,
  formatDate: (isoDate) => `date:${isoDate}`,
  t,
};

describe("findGroupExpenseForDetail", () => {
  const expenses = [buildExpense(), buildExpense({ id: "expense-2" })];

  it("matches the trimmed id", () => {
    expect(findGroupExpenseForDetail(expenses, " expense-2 ")?.id).toBe(
      "expense-2",
    );
  });

  it("returns null for an unknown or blank id", () => {
    expect(findGroupExpenseForDetail(expenses, "expense-9")).toBeNull();
    expect(findGroupExpenseForDetail(expenses, "  ")).toBeNull();
    expect(
      findGroupExpenseForDetail(expenses, null as unknown as string),
    ).toBeNull();
  });
});

describe("getGroupExpensePayerLabel", () => {
  const members = buildMembers();

  it("labels the viewer", () => {
    expect(
      getGroupExpensePayerLabel(
        buildExpense({ payerId: VIEWER }),
        members,
        VIEWER,
        t,
      ),
    ).toBe("viewerName");
  });

  it("resolves the member name", () => {
    expect(
      getGroupExpensePayerLabel(
        buildExpense({ payerId: "user-b" }),
        members,
        VIEWER,
        t,
      ),
    ).toBe("Beto");
  });

  it("uses the translated fallback for an unknown member", () => {
    expect(
      getGroupExpensePayerLabel(
        buildExpense({ payerId: "user-z" }),
        members,
        VIEWER,
        t,
      ),
    ).toBe("memberFallback");
  });
});

describe("getGroupExpenseSplitModeLabel", () => {
  it.each([
    ["equal", "detail.split.equal"],
    ["percentage", "detail.split.percentage"],
    ["fixed", "detail.split.fixed"],
    ["shares", "detail.split.shares"],
  ] as const)("maps %s", (mode, key) => {
    expect(getGroupExpenseSplitModeLabel(mode, t)).toBe(key);
  });
});

describe("getGroupExpenseDetailSummary", () => {
  it("formats the amount with the expense currency", () => {
    expect(
      getGroupExpenseDetailSummary(buildExpense(), formatCurrency, t),
    ).toEqual({
      label: "detail.summaryLabel",
      amount: "10.00 EUR",
      meta: "EUR",
      tone: "neutral",
    });
  });
});

describe("group expense detail context", () => {
  it("keeps the date formatter available for the fields builder", () => {
    expect(context.formatDate("2026-11-10")).toBe("date:2026-11-10");
  });
});
