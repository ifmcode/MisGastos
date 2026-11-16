import { describe, expect, it } from "@jest/globals";

import { mapSharedExpenseDocument } from "../shared-expenses.mapper";
import { buildExpenseDocument } from "./shared-expense-document.fixtures";

describe("mapSharedExpenseDocument", () => {
  it("maps a valid document and derives the pair id", () => {
    const expense = mapSharedExpenseDocument(
      "expense-1",
      buildExpenseDocument({ pairId: undefined }),
    );

    expect(expense).toMatchObject({
      id: "expense-1",
      pairId: "user-a__user-b",
      participantIds: ["user-a", "user-b"],
      payerId: "user-a",
      amountCents: 1000,
      currency: "EUR",
      splitMode: "equal",
      description: "Dinner",
      date: "2026-11-10",
      createdBy: "user-a",
      deletedAt: null,
    });
    expect(expense?.participants).toHaveLength(2);
  });

  it("trims text fields and reads a soft delete stamp", () => {
    const expense = mapSharedExpenseDocument(" expense-1 ", {
      ...buildExpenseDocument({ description: "  Dinner  " }),
      deletedAt: " 2026-11-11T10:00:00.000Z ",
    });

    expect(expense).toMatchObject({
      id: "expense-1",
      description: "Dinner",
      deletedAt: "2026-11-11T10:00:00.000Z",
    });
  });

  it("falls back to empty strings when the audit fields are missing", () => {
    const expense = mapSharedExpenseDocument(
      "expense-1",
      buildExpenseDocument({ date: undefined, createdAt: undefined }),
    );

    expect(expense).toMatchObject({ date: "", createdAt: "", deletedAt: null });
  });

  it("keeps the optional split metadata of its mode", () => {
    const expense = mapSharedExpenseDocument(
      "expense-1",
      buildExpenseDocument({
        splitMode: "percentage",
        participants: [
          { userId: "user-a", shareCents: 500, percentageBps: 5000 },
          { userId: "user-b", shareCents: 500, percentageBps: 5000 },
        ],
      }),
    );

    expect(expense?.participants[0]).toEqual({
      userId: "user-a",
      shareCents: 500,
      percentageBps: 5000,
    });
  });

  it("ignores split metadata that is not an integer", () => {
    const expense = mapSharedExpenseDocument(
      "expense-1",
      buildExpenseDocument({
        splitMode: "shares",
        participants: [
          { userId: "user-a", shareCents: 500, weight: 1.5 },
          { userId: "user-b", shareCents: 500, weight: "2" },
        ],
      }),
    );

    expect(expense?.participants.map((row) => row.weight)).toEqual([
      undefined,
      undefined,
    ]);
  });

  it("reads the trimmed wallet link of a linked expense", () => {
    const expense = mapSharedExpenseDocument(
      "expense-1",
      buildExpenseDocument({
        walletId: " wallet-1 ",
        categoryId: " category-1 ",
        linkedTransactionId: " movement-1 ",
      }),
    );

    expect(expense).toMatchObject({
      walletId: "wallet-1",
      categoryId: "category-1",
      linkedTransactionId: "movement-1",
    });
  });

  it("defaults missing or blank link fields to null", () => {
    const expense = mapSharedExpenseDocument(
      "expense-1",
      buildExpenseDocument({ walletId: "   ", categoryId: undefined }),
    );

    expect(expense).toMatchObject({
      walletId: null,
      categoryId: null,
      linkedTransactionId: null,
    });
  });
});
