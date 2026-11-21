import { describe, expect, it } from "@jest/globals";

import { mapGroupExpenseDocument } from "../group-expenses.mapper";
import { CREATED_AT, GROUP_ID, buildDocument } from "./group-expense-document.fixtures";

describe("mapGroupExpenseDocument", () => {
  it("maps a valid document", () => {
    expect(mapGroupExpenseDocument("expense-1", buildDocument())).toEqual({
      id: "expense-1",
      groupId: GROUP_ID,
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
      createdBy: "user-a",
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
      deletedAt: null,
    });
  });

  it("trims text fields and normalizes the stored date", () => {
    const expense = mapGroupExpenseDocument(" expense-1 ", {
      ...buildDocument({
        description: "  Dinner  ",
        date: "10/11/2026",
        updatedAt: " 2026-11-12T10:00:00.000Z ",
      }),
      deletedAt: " 2026-11-11T10:00:00.000Z ",
    });

    expect(expense).toMatchObject({
      id: "expense-1",
      description: "Dinner",
      date: "2026-11-10",
      updatedAt: "2026-11-12T10:00:00.000Z",
      deletedAt: "2026-11-11T10:00:00.000Z",
    });
  });

  it("keeps the optional split metadata of its mode", () => {
    const expense = mapGroupExpenseDocument(
      "expense-1",
      buildDocument({
        splitMode: "percentage",
        participants: [
          { userId: "user-a", shareCents: 500, percentageBps: 5000 },
          { userId: "user-b", shareCents: 500, weight: 2 },
        ],
      }),
    );

    expect(expense?.participants).toEqual([
      { userId: "user-a", shareCents: 500, percentageBps: 5000 },
      { userId: "user-b", shareCents: 500, weight: 2 },
    ]);
  });

  it("ignores split metadata that is not an integer", () => {
    const expense = mapGroupExpenseDocument(
      "expense-1",
      buildDocument({
        splitMode: "shares",
        participants: [
          { userId: "user-a", shareCents: 500, weight: 1.5 },
          { userId: "user-b", shareCents: 500, percentageBps: "20" },
        ],
      }),
    );

    expect(
      expense?.participants.map((row) => [row.weight, row.percentageBps]),
    ).toEqual([
      [undefined, undefined],
      [undefined, undefined],
    ]);
  });

  it("falls back to empty strings when the audit stamps are missing", () => {
    const expense = mapGroupExpenseDocument(
      "expense-1",
      buildDocument({ updatedAt: undefined }),
    );

    expect(expense?.updatedAt).toBe("");
  });
});
