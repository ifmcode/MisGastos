import { describe, expect, it } from "@jest/globals";

import type {
  GroupBalances,
  GroupCurrencyBalances,
  GroupSettlementLedgerEntry,
} from "../../types/group-balance.types";
import {
  buildDirectGroupDebts,
  calculateGroupBalances,
  calculateGroupNetBalances,
  getMemberNetBalances,
  getViewerGroupBalance,
  simplifyGroupDebts,
} from "../group-balances";
import { buildGroupExpense } from "./group-expense.fixtures";

/** 90 € dinner split three ways with user-a paying: +60 / -30 / -30. */
const dinner = buildGroupExpense({
  payerId: "user-a",
  amountCents: 9000,
  participants: [
    { userId: "user-a", shareCents: 3000 },
    { userId: "user-b", shareCents: 3000 },
    { userId: "user-c", shareCents: 3000 },
  ],
});

/** A owes B 10 when B pays and charges A the whole amount. */
const aOwesB = buildGroupExpense({
  id: "a-owes-b",
  payerId: "user-b",
  amountCents: 1000,
  participants: [
    { userId: "user-a", shareCents: 1000 },
    { userId: "user-b", shareCents: 0 },
  ],
});

/** B owes C 10 when C pays and charges B the whole amount. */
const bOwesC = buildGroupExpense({
  id: "b-owes-c",
  payerId: "user-c",
  amountCents: 1000,
  participants: [
    { userId: "user-b", shareCents: 1000 },
    { userId: "user-c", shareCents: 0 },
  ],
});

function settlement(
  overrides: Partial<GroupSettlementLedgerEntry> = {},
): GroupSettlementLedgerEntry {
  return {
    fromUserId: "user-b",
    toUserId: "user-a",
    amountCents: 500,
    currency: "EUR",
    deletedAt: null,
    ...overrides,
  };
}

function sumNets(currency: GroupCurrencyBalances): number {
  return currency.balances.reduce(
    (total, balance) => total + balance.netCents,
    0,
  );
}

describe("calculateGroupNetBalances", () => {
  it("nets the 90 €/3 example to A +60, B -30 and C -30 with a zero sum", () => {
    const balances = calculateGroupNetBalances([dinner], []);

    expect(balances).toEqual([
      {
        currency: "EUR",
        balances: [
          { userId: "user-a", netCents: 6000 },
          { userId: "user-b", netCents: -3000 },
          { userId: "user-c", netCents: -3000 },
        ],
      },
    ]);
    expect(sumNets(balances[0])).toBe(0);
  });

  it("debts the payer their own share so they net paid minus share", () => {
    const balances = calculateGroupNetBalances([buildGroupExpense()], []);

    expect(balances[0].balances).toEqual([
      { userId: "user-a", netCents: 500 },
      { userId: "user-b", netCents: -500 },
    ]);
  });

  it("keeps the whole amount when the payer is excluded from the participants", () => {
    const balances = calculateGroupNetBalances(
      [
        buildGroupExpense({
          amountCents: 1000,
          participants: [{ userId: "user-b", shareCents: 1000 }],
        }),
      ],
      [],
    );

    expect(balances[0].balances).toEqual([
      { userId: "user-a", netCents: 1000 },
      { userId: "user-b", netCents: -1000 },
    ]);
  });

  it("folds partial and multiple settlements and drops the settled member", () => {
    const balances = calculateGroupNetBalances(
      [dinner],
      [
        settlement({ amountCents: 1000 }),
        settlement({ amountCents: 3000, fromUserId: "user-c" }),
      ],
    );

    expect(balances).toEqual([
      {
        currency: "EUR",
        balances: [
          { userId: "user-a", netCents: 2000 },
          { userId: "user-b", netCents: -2000 },
        ],
      },
    ]);
    expect(sumNets(balances[0])).toBe(0);
  });

  it("ignores soft-deleted expenses and settlements", () => {
    const balances = calculateGroupNetBalances(
      [
        dinner,
        buildGroupExpense({
          id: "deleted-expense",
          amountCents: 9000,
          participants: [{ userId: "user-b", shareCents: 9000 }],
          deletedAt: "2026-11-12T10:00:00.000Z",
        }),
      ],
      [
        settlement({ amountCents: 1000 }),
        settlement({ amountCents: 2000, deletedAt: "2026-11-12T10:00:00.000Z" }),
        settlement({ amountCents: 4000, deletedAt: "" }),
      ],
    );

    expect(balances[0].balances).toEqual([
      { userId: "user-a", netCents: 5000 },
      { userId: "user-b", netCents: -2000 },
      { userId: "user-c", netCents: -3000 },
    ]);
  });

  it("returns every balance to zero once all the debts are settled", () => {
    const settlements = [
      settlement({ amountCents: 3000 }),
      settlement({ amountCents: 3000, fromUserId: "user-c" }),
    ];

    expect(calculateGroupNetBalances([dinner], settlements)).toEqual([]);
    expect(buildDirectGroupDebts([dinner], settlements)).toEqual([]);
    expect(calculateGroupBalances([dinner], settlements, true)).toEqual({
      currencies: [],
      debts: [],
      simplifyDebts: true,
    });
  });

  it("keeps every currency separate, never converted nor summed", () => {
    const usd = buildGroupExpense({
      id: "usd",
      currency: "USD",
      payerId: "user-b",
      amountCents: 1000,
      participants: [
        { userId: "user-a", shareCents: 1000 },
        { userId: "user-b", shareCents: 0 },
      ],
    });
    const chf = buildGroupExpense({
      id: "chf",
      currency: "CHF",
      amountCents: 200,
      participants: [{ userId: "user-b", shareCents: 200 }],
    });
    const jpy = buildGroupExpense({
      id: "jpy",
      currency: "JPY",
      amountCents: 500,
      participants: [{ userId: "user-c", shareCents: 500 }],
    });

    const balances = calculateGroupNetBalances(
      [usd, chf, jpy, dinner],
      [
        settlement({
          fromUserId: "user-a",
          toUserId: "user-b",
          amountCents: 100,
          currency: "USD",
        }),
      ],
    );

    expect(balances.map((item) => item.currency)).toEqual([
      "EUR",
      "CHF",
      "JPY",
      "USD",
    ]);
    expect(balances.map(sumNets)).toEqual([0, 0, 0, 0]);
    expect(balances[3].balances).toEqual([
      { userId: "user-a", netCents: -900 },
      { userId: "user-b", netCents: 900 },
    ]);
  });

  it("drops zero nets and malformed cents instead of leaking NaN", () => {
    const settled = buildGroupExpense({
      payerId: "user-a",
      amountCents: 1000,
      participants: [{ userId: "user-a", shareCents: 1000 }],
    });
    const malformed = buildGroupExpense({
      id: "malformed",
      payerId: "user-b",
      amountCents: Number.NaN,
      participants: [{ userId: "user-c", shareCents: Number.NaN }],
    });

    expect(calculateGroupNetBalances([settled], [])).toEqual([]);
    expect(calculateGroupNetBalances([malformed], [])).toEqual([]);
  });
});

describe("buildDirectGroupDebts", () => {
  it("returns one row per non-payer share, ordered by pair", () => {
    expect(buildDirectGroupDebts([dinner], [])).toEqual([
      { currency: "EUR", fromUserId: "user-b", toUserId: "user-a", amountCents: 3000 },
      { currency: "EUR", fromUserId: "user-c", toUserId: "user-a", amountCents: 3000 },
    ]);
  });

  it("keeps A owes B and B owes C as two direct debts", () => {
    expect(buildDirectGroupDebts([aOwesB, bOwesC], [])).toEqual([
      { currency: "EUR", fromUserId: "user-a", toUserId: "user-b", amountCents: 1000 },
      { currency: "EUR", fromUserId: "user-b", toUserId: "user-c", amountCents: 1000 },
    ]);
  });

  it("reduces the pair with a partial settlement and accepts several", () => {
    const debts = buildDirectGroupDebts(
      [aOwesB],
      [
        settlement({ fromUserId: "user-a", toUserId: "user-b", amountCents: 400 }),
        settlement({ fromUserId: "user-a", toUserId: "user-b", amountCents: 200 }),
      ],
    );

    expect(debts).toEqual([
      { currency: "EUR", fromUserId: "user-a", toUserId: "user-b", amountCents: 400 },
    ]);
  });

  it("cancels a fully settled pair and flips an overpayment", () => {
    expect(
      buildDirectGroupDebts(
        [aOwesB],
        [
          settlement({
            fromUserId: "user-a",
            toUserId: "user-b",
            amountCents: 1000,
          }),
        ],
      ),
    ).toEqual([]);
    expect(
      buildDirectGroupDebts(
        [aOwesB],
        [
          settlement({
            fromUserId: "user-a",
            toUserId: "user-b",
            amountCents: 1200,
          }),
        ],
      ),
    ).toEqual([
      { currency: "EUR", fromUserId: "user-b", toUserId: "user-a", amountCents: 200 },
    ]);
  });

  it("ignores soft-deleted, zero and self settlements", () => {
    expect(
      buildDirectGroupDebts(
        [aOwesB],
        [
          settlement({
            fromUserId: "user-a",
            toUserId: "user-b",
            amountCents: 1000,
            deletedAt: "2026-11-12T10:00:00.000Z",
          }),
          settlement({ fromUserId: "user-a", toUserId: "user-b", amountCents: 0 }),
          settlement({ fromUserId: "user-a", toUserId: "user-a" }),
        ],
      ),
    ).toEqual([
      { currency: "EUR", fromUserId: "user-a", toUserId: "user-b", amountCents: 1000 },
    ]);
  });
});

describe("simplifyGroupDebts", () => {
  it("turns A owes B and B owes C into A owes C", () => {
    const currencies = calculateGroupNetBalances([aOwesB, bOwesC], []);

    expect(simplifyGroupDebts(currencies)).toEqual([
      { currency: "EUR", fromUserId: "user-a", toUserId: "user-c", amountCents: 1000 },
    ]);
  });

  it("uses at most n-1 transfers, biggest debtor and creditor first", () => {
    const currencies: GroupCurrencyBalances[] = [
      {
        currency: "EUR",
        balances: [
          { userId: "user-b", netCents: -3000 },
          { userId: "user-d", netCents: 4000 },
          { userId: "user-a", netCents: -5000 },
          { userId: "user-c", netCents: 4000 },
        ],
      },
    ];

    const debts = simplifyGroupDebts(currencies);

    expect(debts).toEqual([
      { currency: "EUR", fromUserId: "user-a", toUserId: "user-c", amountCents: 4000 },
      { currency: "EUR", fromUserId: "user-a", toUserId: "user-d", amountCents: 1000 },
      { currency: "EUR", fromUserId: "user-b", toUserId: "user-d", amountCents: 3000 },
    ]);
    // 4 non-zero balances, 3 transfers, and never more than the nets require.
    expect(debts).toHaveLength(3);
    expect(debts.reduce((total, debt) => total + debt.amountCents, 0)).toBe(
      8000,
    );
  });

  it("simplifies each currency independently and orders EUR first", () => {
    const debts = simplifyGroupDebts([
      {
        currency: "USD",
        balances: [
          { userId: "user-a", netCents: -100 },
          { userId: "user-b", netCents: 100 },
        ],
      },
      {
        currency: "EUR",
        balances: [
          { userId: "user-b", netCents: -100 },
          { userId: "user-a", netCents: 100 },
        ],
      },
    ]);

    expect(debts).toEqual([
      { currency: "EUR", fromUserId: "user-b", toUserId: "user-a", amountCents: 100 },
      { currency: "USD", fromUserId: "user-a", toUserId: "user-b", amountCents: 100 },
    ]);
    expect(simplifyGroupDebts([])).toEqual([]);
    expect(simplifyGroupDebts([{ currency: "EUR", balances: [] }])).toEqual([]);
  });
});

describe("calculateGroupBalances", () => {
  it("keeps the nets independent from the toggle and swaps only the debts", () => {
    const expenses = [aOwesB, bOwesC];
    const simplified = calculateGroupBalances(expenses, [], true);
    const direct = calculateGroupBalances(expenses, [], false);

    expect(simplified.currencies).toEqual(direct.currencies);
    expect(simplified.simplifyDebts).toBe(true);
    expect(direct.simplifyDebts).toBe(false);
    expect(simplified.debts).toEqual([
      { currency: "EUR", fromUserId: "user-a", toUserId: "user-c", amountCents: 1000 },
    ]);
    expect(direct.debts).toEqual([
      { currency: "EUR", fromUserId: "user-a", toUserId: "user-b", amountCents: 1000 },
      { currency: "EUR", fromUserId: "user-b", toUserId: "user-c", amountCents: 1000 },
    ]);
  });
});

describe("getViewerGroupBalance", () => {
  it("returns the viewer nets and keeps currencies ordered", () => {
    const balances = calculateGroupBalances([dinner, aOwesB], [], true);

    expect(getViewerGroupBalance(balances, "user-b")).toEqual([
      { currency: "EUR", netCents: -2000 },
    ]);
    expect(getViewerGroupBalance(balances, "user-a")).toEqual([
      { currency: "EUR", netCents: 5000 },
    ]);
  });

  it("returns an empty list for a settled, absent or blank viewer", () => {
    const balances: GroupBalances = {
      currencies: [
        {
          currency: "EUR",
          balances: [{ userId: "user-a", netCents: 0 }],
        },
      ],
      debts: [],
      simplifyDebts: true,
    };

    expect(getViewerGroupBalance(balances, "user-a")).toEqual([]);
    expect(getViewerGroupBalance(balances, "user-z")).toEqual([]);
    expect(getViewerGroupBalance(balances, "  ")).toEqual([]);
    expect(
      getViewerGroupBalance(balances, null as unknown as string),
    ).toEqual([]);
  });
});

describe("getMemberNetBalances", () => {
  const currencies: GroupCurrencyBalances[] = [
    {
      currency: "EUR",
      balances: [
        { userId: "user-a", netCents: 0 },
        { userId: "user-b", netCents: -500 },
      ],
    },
    {
      currency: "USD",
      balances: [{ userId: "user-b", netCents: 1200 }],
    },
  ];

  it("returns the member's non-zero nets, one row per currency", () => {
    expect(getMemberNetBalances(currencies, "user-b")).toEqual([
      { currency: "EUR", netCents: -500 },
      { currency: "USD", netCents: 1200 },
    ]);
    expect(getMemberNetBalances(currencies, " user-b ")).toEqual([
      { currency: "EUR", netCents: -500 },
      { currency: "USD", netCents: 1200 },
    ]);
  });

  it("returns an empty list for a settled, absent or blank member", () => {
    expect(getMemberNetBalances(currencies, "user-a")).toEqual([]);
    expect(getMemberNetBalances(currencies, "user-z")).toEqual([]);
    expect(getMemberNetBalances(currencies, "  ")).toEqual([]);
    expect(
      getMemberNetBalances(currencies, null as unknown as string),
    ).toEqual([]);
  });
});
