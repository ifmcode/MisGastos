import { describe, expect, it, jest } from "@jest/globals";

import type { ViewerGroupBalance } from "../../types/group-balance.types";
import {
  getViewerBalanceLines,
  type ViewerBalanceCopy,
} from "../viewer-balance-lines";

const copy: ViewerBalanceCopy = {
  owedToYou: (amount) => `Te deben ${amount}`,
  youOwe: (amount) => `Debes ${amount}`,
};

const formatAmount = jest.fn(
  (amount: number, currency: string) => `${amount.toFixed(2)} ${currency}`,
);

describe("getViewerBalanceLines", () => {
  it("renders positive nets as money owed to the viewer", () => {
    const balances: ViewerGroupBalance[] = [
      { currency: "EUR", netCents: 1250 },
    ];

    expect(getViewerBalanceLines(balances, copy, formatAmount)).toEqual([
      {
        currency: "EUR",
        direction: "owed-to-viewer",
        text: "Te deben 12.50 EUR",
      },
    ]);
    expect(formatAmount).toHaveBeenCalledWith(12.5, "EUR");
  });

  it("formats the absolute value for a negative net", () => {
    const balances: ViewerGroupBalance[] = [{ currency: "USD", netCents: -300 }];

    expect(getViewerBalanceLines(balances, copy, formatAmount)).toEqual([
      {
        currency: "USD",
        direction: "viewer-owes",
        text: "Debes 3.00 USD",
      },
    ]);
  });

  it("drops zero nets and keeps one line per currency in order", () => {
    const balances: ViewerGroupBalance[] = [
      { currency: "EUR", netCents: 500 },
      { currency: "GBP", netCents: 0 },
      { currency: "USD", netCents: -100 },
    ];

    const lines = getViewerBalanceLines(balances, copy, formatAmount);

    expect(lines.map((line) => line.currency)).toEqual(["EUR", "USD"]);
    expect(lines.map((line) => line.direction)).toEqual([
      "owed-to-viewer",
      "viewer-owes",
    ]);
  });

  it("returns no lines when settled", () => {
    expect(getViewerBalanceLines([], copy, formatAmount)).toEqual([]);
  });
});
