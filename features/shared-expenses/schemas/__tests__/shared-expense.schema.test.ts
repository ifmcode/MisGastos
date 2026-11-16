import { describe, expect, it } from "@jest/globals";

import { validateSharedExpenseInput } from "../shared-expense.schema";
import { buildInput, VIEWER } from "./shared-expense-input.test-helpers";

describe("validateSharedExpenseInput - happy paths", () => {
  it("normalizes an equal expense and sorts the participant ids", () => {
    expect(
      validateSharedExpenseInput(
        buildInput({
          participants: [
            { userId: " user-b ", value: "" },
            { userId: "user-a", value: "" },
          ],
        }),
        VIEWER,
      ),
    ).toEqual({
      ok: true,
      value: {
        participantIds: ["user-a", "user-b"],
        payerId: "user-a",
        amountCents: 1000,
        currency: "EUR",
        splitMode: "equal",
        participants: [
          { userId: "user-a", shareCents: 500 },
          { userId: "user-b", shareCents: 500 },
        ],
        description: "Dinner",
        date: "2026-11-10",
        walletId: null,
        categoryId: null,
        linkedTransactionId: null,
      },
    });
  });

  it("splits by percentage with 2 decimals", () => {
    const result = validateSharedExpenseInput(
      buildInput({
        splitMode: "percentage",
        participants: [
          { userId: "user-a", value: "66.67" },
          { userId: "user-b", value: "33.33" },
        ],
      }),
      VIEWER,
    );

    expect(result.ok && result.value.participants).toEqual([
      { userId: "user-a", shareCents: 667, percentageBps: 6667 },
      { userId: "user-b", shareCents: 333, percentageBps: 3333 },
    ]);
  });

  it("splits by fixed cents", () => {
    const result = validateSharedExpenseInput(
      buildInput({
        splitMode: "fixed",
        participants: [
          { userId: "user-a", value: "3,50" },
          { userId: "user-b", value: "6.50" },
        ],
      }),
      VIEWER,
    );

    expect(result.ok && result.value.participants).toEqual([
      { userId: "user-a", shareCents: 350 },
      { userId: "user-b", shareCents: 650 },
    ]);
  });

  it("splits by shares", () => {
    const result = validateSharedExpenseInput(
      buildInput({
        splitMode: "shares",
        participants: [
          { userId: "user-a", value: "1" },
          { userId: "user-b", value: "3" },
        ],
      }),
      VIEWER,
    );

    expect(result.ok && result.value.participants).toEqual([
      { userId: "user-a", shareCents: 250, weight: 1 },
      { userId: "user-b", shareCents: 750, weight: 3 },
    ]);
  });

  it("accepts the friend as payer and a DD/MM/YYYY date", () => {
    const result = validateSharedExpenseInput(
      buildInput({ payerId: "user-b", date: "10/11/2026" }),
      VIEWER,
    );

    expect(result.ok && result.value.payerId).toBe("user-b");
    expect(result.ok && result.value.date).toBe("2026-11-10");
  });

  it("accepts the maximum amount", () => {
    const result = validateSharedExpenseInput(
      buildInput({ amount: "1000000" }),
      VIEWER,
    );

    expect(result.ok && result.value.amountCents).toBe(100_000_000);
  });
});

describe("validateSharedExpenseInput - optional wallet link", () => {
  it("trims the wallet and keeps the supplied category", () => {
    const result = validateSharedExpenseInput(
      buildInput({ walletId: " wallet-1 ", categoryId: " category-1 " }),
      VIEWER,
    );

    expect(result.ok && result.value).toMatchObject({
      walletId: "wallet-1",
      categoryId: "category-1",
      linkedTransactionId: null,
    });
  });

  it("nulls the wallet and category when no wallet is selected", () => {
    const result = validateSharedExpenseInput(
      buildInput({ walletId: "   ", categoryId: "category-1" }),
      VIEWER,
    );

    expect(result.ok && result.value).toMatchObject({
      walletId: null,
      categoryId: null,
    });
  });

  it("drops a category sent without a wallet", () => {
    const result = validateSharedExpenseInput(
      buildInput({ categoryId: "category-1" }),
      VIEWER,
    );

    expect(result.ok && result.value.categoryId).toBeNull();
  });

  it("never accepts the linked movement id from the form", () => {
    const result = validateSharedExpenseInput(
      {
        ...buildInput({ walletId: "wallet-1" }),
        linkedTransactionId: "movement-1",
      } as unknown as Parameters<typeof validateSharedExpenseInput>[0],
      VIEWER,
    );

    expect(result.ok && result.value.linkedTransactionId).toBeNull();
  });
});
