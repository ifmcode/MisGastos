import { describe, expect, it } from "@jest/globals";

import {
  FakeGroupExpensesRepository,
  GROUP_ID,
  buildExpense,
} from "../../services/__tests__/group-expenses-service.fakes";
import {
  FakeGroupSettlementsRepository,
  buildGroupSettlement,
} from "../../services/__tests__/group-settlements-service.fakes";
import { FirebaseGroupBalancePort } from "../firebase-group-balance.port";

function createPort() {
  const expenses = new FakeGroupExpensesRepository();
  const settlements = new FakeGroupSettlementsRepository();

  return {
    expenses,
    settlements,
    port: new FirebaseGroupBalancePort(expenses, settlements),
  };
}

/** `user-b` owes `user-a` half of a 1000 EUR expense paid by `user-a`. */
function seedSharedExpense(
  expenses: FakeGroupExpensesRepository,
  overrides: Record<string, unknown> = {},
) {
  expenses.seed(
    buildExpense({
      payerId: "user-a",
      amountCents: 1000,
      currency: "EUR",
      participants: [
        { userId: "user-a", shareCents: 500 },
        { userId: "user-b", shareCents: 500 },
      ],
      ...overrides,
    }),
  );
}

describe("FirebaseGroupBalancePort", () => {
  it("returns the member's non-zero net per currency", async () => {
    const { expenses, settlements, port } = createPort();
    seedSharedExpense(expenses);

    await expect(port.getMemberNets(GROUP_ID, "user-b")).resolves.toEqual([
      { currency: "EUR", netCents: -500 },
    ]);
    await expect(port.getMemberNets(GROUP_ID, "user-a")).resolves.toEqual([
      { currency: "EUR", netCents: 500 },
    ]);
    expect(settlements.settlements.size).toBe(0);
  });

  it("drops zero lines: a settled member returns an empty list", async () => {
    const { expenses, settlements, port } = createPort();
    seedSharedExpense(expenses);
    settlements.seed(
      buildGroupSettlement({
        participantIds: ["user-a", "user-b"],
        pairId: "user-a__user-b",
        fromUserId: "user-b",
        toUserId: "user-a",
        amountCents: 500,
      }),
    );

    await expect(port.getMemberNets(GROUP_ID, "user-b")).resolves.toEqual([]);
  });

  it("keeps currencies separate and ignores soft-deleted rows", async () => {
    const { expenses, settlements, port } = createPort();
    seedSharedExpense(expenses);
    seedSharedExpense(expenses, {
      id: "expense-usd",
      currency: "USD",
      amountCents: 2000,
      participants: [
        { userId: "user-a", shareCents: 1000 },
        { userId: "user-b", shareCents: 1000 },
      ],
    });
    expenses.seed(
      buildExpense({
        id: "expense-deleted",
        currency: "EUR",
        amountCents: 800,
        deletedAt: "2026-11-19T10:00:00.000Z",
      }),
    );

    await expect(port.getMemberNets(GROUP_ID, "user-b")).resolves.toEqual([
      { currency: "EUR", netCents: -500 },
      { currency: "USD", netCents: -1000 },
    ]);
    expect(settlements.settlements.size).toBe(0);
  });
});
