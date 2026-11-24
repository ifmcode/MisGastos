import { describe, expect, it } from "@jest/globals";

import {
  buildOutstandingBalancesMessage,
  getMemberOutstandingBalances,
  type GroupBalancesSource,
} from "../group-member-balances";

const BALANCES: GroupBalancesSource = {
  currencies: [
    {
      currency: "EUR",
      balances: [
        { userId: "ana", netCents: -1250 },
        { userId: "luis", netCents: 1250 },
        { userId: "cero", netCents: 0 },
      ],
    },
    {
      currency: "USD",
      balances: [
        { userId: "ana", netCents: 800 },
        { userId: "luis", netCents: -800 },
      ],
    },
    {
      currency: "GBP",
      balances: [{ userId: "ana", netCents: 0 }],
    },
  ],
};

describe("getMemberOutstandingBalances", () => {
  it("returns only the non-zero nets, in currency order", () => {
    expect(getMemberOutstandingBalances(BALANCES, "ana")).toEqual([
      { currency: "EUR", netCents: -1250 },
      { currency: "USD", netCents: 800 },
    ]);
  });

  it("keeps the direction of each net", () => {
    expect(getMemberOutstandingBalances(BALANCES, "luis")).toEqual([
      { currency: "EUR", netCents: 1250 },
      { currency: "USD", netCents: -800 },
    ]);
  });

  it("returns an empty list for a settled member", () => {
    expect(getMemberOutstandingBalances(BALANCES, "cero")).toEqual([]);
  });

  it("returns an empty list without balances, member or a known member", () => {
    expect(getMemberOutstandingBalances(null, "ana")).toEqual([]);
    expect(getMemberOutstandingBalances(BALANCES, null)).toEqual([]);
    expect(getMemberOutstandingBalances(BALANCES, "   ")).toEqual([]);
    expect(getMemberOutstandingBalances(BALANCES, "nadie")).toEqual([]);
  });

  it("trims the ids before matching", () => {
    expect(getMemberOutstandingBalances(BALANCES, " ana ")).toHaveLength(2);
  });

  it("ignores a malformed net", () => {
    const malformed: GroupBalancesSource = {
      currencies: [
        {
          currency: "EUR",
          balances: [{ userId: "ana", netCents: Number.NaN }],
        },
      ],
    };

    expect(getMemberOutstandingBalances(malformed, "ana")).toEqual([]);
  });
});

describe("buildOutstandingBalancesMessage", () => {
  const formatAmount = (netCents: number, currency: string) =>
    `${netCents / 100} ${currency}`;
  const owesGroup = (amount: string) => `owes ${amount}`;
  const groupOwes = (amount: string) => `owed ${amount}`;

  it("writes one line per currency with its direction and absolute amount", () => {
    expect(
      buildOutstandingBalancesMessage(
        [
          { currency: "EUR", netCents: -1250 },
          { currency: "USD", netCents: 800 },
        ],
        { formatAmount, owesGroup, groupOwes },
      ),
    ).toBe("owes 12.5 EUR\nowed 8 USD");
  });

  it("prepends the intro on its own line", () => {
    expect(
      buildOutstandingBalancesMessage(
        [{ currency: "EUR", netCents: -100 }],
        { formatAmount, owesGroup, groupOwes, intro: "Settle first:" },
      ),
    ).toBe("Settle first:\nowes 1 EUR");
  });

  it("returns only the intro when there is nothing outstanding", () => {
    expect(
      buildOutstandingBalancesMessage([], {
        formatAmount,
        owesGroup,
        groupOwes,
        intro: "Settle first:",
      }),
    ).toBe("Settle first:");
    expect(
      buildOutstandingBalancesMessage([], {
        formatAmount,
        owesGroup,
        groupOwes,
      }),
    ).toBe("");
  });
});
