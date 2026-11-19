import { describe, expect, it } from "@jest/globals";

import {
  buildExpenseLedgerEntries,
  filterActiveExpenses,
  sortSharedExpenses,
} from "../expense-ledger";
import { buildSharedExpense as expense } from "./shared-expense.fixtures";

describe("filterActiveExpenses", () => {
  it("keeps active expenses and drops soft-deleted ones", () => {
    const expenses = [
      expense({ id: "1" }),
      expense({ id: "2", deletedAt: "2026-11-14T00:00:00.000Z" }),
      expense({ id: "3", deletedAt: "" }),
    ];

    expect(filterActiveExpenses(expenses).map((item) => item.id)).toEqual([
      "1",
      "3",
    ]);
  });

  it("returns an empty list without expenses", () => {
    expect(filterActiveExpenses([])).toEqual([]);
  });
});

describe("sortSharedExpenses", () => {
  it("orders by date descending", () => {
    const expenses = [
      expense({ id: "old", date: "2026-11-01" }),
      expense({ id: "new", date: "2026-11-15" }),
    ];

    expect(sortSharedExpenses(expenses).map((item) => item.id)).toEqual([
      "new",
      "old",
    ]);
    expect(sortSharedExpenses([...expenses].reverse()).map((item) => item.id))
      .toEqual(["new", "old"]);
  });

  it("breaks date ties by createdAt descending", () => {
    const expenses = [
      expense({ id: "older", createdAt: "2026-11-10T10:00:00.000Z" }),
      expense({ id: "newer", createdAt: "2026-11-10T12:00:00.000Z" }),
    ];

    expect(sortSharedExpenses(expenses).map((item) => item.id)).toEqual([
      "newer",
      "older",
    ]);
    expect(sortSharedExpenses([...expenses].reverse()).map((item) => item.id))
      .toEqual(["newer", "older"]);
  });

  it("breaks full ties by id ascending and never mutates the input", () => {
    const expenses = [
      expense({ id: "b" }),
      expense({ id: "a" }),
      expense({ id: "c" }),
    ];
    const sorted = sortSharedExpenses(expenses);

    expect(sorted.map((item) => item.id)).toEqual(["a", "b", "c"]);
    expect(expenses.map((item) => item.id)).toEqual(["b", "a", "c"]);
  });
});

describe("buildExpenseLedgerEntries", () => {
  it("creates one entry per non-payer participant", () => {
    expect(buildExpenseLedgerEntries([expense()])).toEqual([
      {
        id: "expense-1",
        fromUserId: "user-b",
        toUserId: "user-a",
        amountCents: 500,
        currency: "EUR",
        deletedAt: null,
      },
    ]);
  });

  it("skips the payer, zero shares and soft-deleted expenses", () => {
    const entries = buildExpenseLedgerEntries([
      expense({
        id: "fixed",
        payerId: "user-b",
        splitMode: "fixed",
        participants: [
          { userId: "user-a", shareCents: 0 },
          { userId: "user-b", shareCents: 1000 },
        ],
      }),
      expense({ id: "deleted", deletedAt: "2026-11-14T00:00:00.000Z" }),
    ]);

    expect(entries).toEqual([]);
  });

  it("passes the expense currency through", () => {
    const entries = buildExpenseLedgerEntries([
      expense({ currency: "USD", payerId: "user-b" }),
    ]);

    expect(entries).toHaveLength(1);
    expect(entries[0].currency).toBe("USD");
    expect(entries[0].fromUserId).toBe("user-a");
    expect(entries[0].toUserId).toBe("user-b");
    expect(entries[0].amountCents).toBe(500);
  });

  it("derives the same debt whether or not the payer linked a wallet", () => {
    const linked = expense({
      walletId: "wallet-1",
      categoryId: "category-1",
      linkedTransactionId: "movement-1",
    });
    const social = expense({
      walletId: null,
      categoryId: null,
      linkedTransactionId: null,
    });

    expect(buildExpenseLedgerEntries([linked])).toEqual(
      buildExpenseLedgerEntries([social]),
    );
  });

  it("emits one entry per debtor in a multi-participant expense", () => {
    const entries = buildExpenseLedgerEntries([
      expense({
        id: "group",
        payerId: "user-a",
        participants: [
          { userId: "user-a", shareCents: 100 },
          { userId: "user-b", shareCents: 300 },
          { userId: "user-c", shareCents: 600 },
        ],
      }),
    ]);

    expect(entries.map((item) => [item.id, item.fromUserId, item.amountCents]))
      .toEqual([
        ["group", "user-b", 300],
        ["group", "user-c", 600],
      ]);
  });
});
