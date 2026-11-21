import { describe, expect, it } from "@jest/globals";

import type { Translate } from "@/shared/i18n/translate";

import type { GroupExpense } from "../../types/group-expense.types";
import { getGroupExpenseRowCopy } from "../group-expense-display";
import { VIEWER } from "./group-expense-ui.test-helpers";

const t: Translate = (key, options) =>
  options ? `${key}|${String(options.name ?? "")}` : key;

function buildExpense(overrides: Partial<GroupExpense> = {}): GroupExpense {
  return {
    id: "expense-1",
    groupId: "group-1",
    payerId: VIEWER,
    amountCents: 900,
    currency: "EUR",
    splitMode: "equal",
    participants: [
      { userId: VIEWER, shareCents: 300 },
      { userId: "user-b", shareCents: 300 },
      { userId: "user-c", shareCents: 300 },
    ],
    description: "Cena",
    date: "2026-11-10",
    createdBy: VIEWER,
    createdAt: "2026-11-10T20:00:00.000Z",
    updatedAt: "2026-11-10T20:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

describe("getGroupExpenseRowCopy", () => {
  it("states the viewer's own payment without a right-hand effect", () => {
    const copy = getGroupExpenseRowCopy(buildExpense(), {
      viewerUid: VIEWER,
      payerName: "Ana",
      t,
    });

    expect(copy).toEqual({
      payerLabel: "row.youPaid",
      effect: "made-payment",
      shareCents: 0,
    });
  });

  it("shows the share a charged viewer still owes", () => {
    const copy = getGroupExpenseRowCopy(
      buildExpense({ payerId: "user-b" }),
      {
        viewerUid: VIEWER,
        payerName: "Beto",
        t,
      },
    );

    expect(copy).toEqual({
      payerLabel: "row.memberPaid|Beto",
      effect: "charged",
      shareCents: 300,
    });
  });

  it("keeps the row neutral when the viewer is not in the split", () => {
    const copy = getGroupExpenseRowCopy(
      buildExpense({
        payerId: "user-b",
        participants: [{ userId: "user-b", shareCents: 900 }],
      }),
      { viewerUid: VIEWER, payerName: "Beto", t },
    );

    expect(copy.effect).toBe("none");
    expect(copy.shareCents).toBe(0);
  });

  it("keeps the row neutral when the viewer's stored share is zero", () => {
    const copy = getGroupExpenseRowCopy(
      buildExpense({
        payerId: "user-b",
        participants: [
          { userId: VIEWER, shareCents: 0 },
          { userId: "user-b", shareCents: 900 },
        ],
      }),
      { viewerUid: VIEWER, payerName: "Beto", t },
    );

    expect(copy.effect).toBe("none");
  });

  it("uses the member label when the viewer is blank", () => {
    const copy = getGroupExpenseRowCopy(
      buildExpense({ payerId: "user-b" }),
      { viewerUid: "   ", payerName: "Beto", t },
    );

    expect(copy.payerLabel).toBe("row.memberPaid|Beto");
  });

  it("treats a defensive non-string viewer as no viewer", () => {
    const copy = getGroupExpenseRowCopy(
      buildExpense({ payerId: "user-b" }),
      { viewerUid: null as unknown as string, payerName: "Beto", t },
    );

    expect(copy.effect).toBe("none");
    expect(copy.payerLabel).toBe("row.memberPaid|Beto");
  });
});
