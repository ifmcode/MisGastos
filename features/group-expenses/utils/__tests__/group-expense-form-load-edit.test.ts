import { describe, expect, it } from "@jest/globals";

import type { GroupExpense } from "../../types/group-expense.types";
import { getGroupExpenseInitialValues } from "../group-expense-form-load";
import {
  buildExpense,
  buildMembers,
  GROUP_ID,
  TODAY,
  VIEWER,
} from "./group-expense-ui.test-helpers";

const memberIds = buildMembers().map((member) => member.uid);

function loadValues(overrides: Partial<GroupExpense> = {}) {
  return getGroupExpenseInitialValues({
    editingExpense: buildExpense(overrides),
    viewerUid: VIEWER,
    groupId: "",
    memberIds,
    groupCurrency: "USD",
    today: TODAY,
  });
}

describe("getGroupExpenseInitialValues (edit)", () => {
  it("maps a stored equal expense with its shares as fixed values", () => {
    const values = loadValues();

    expect(values).toMatchObject({
      groupId: GROUP_ID,
      amount: "10.00",
      currency: "EUR",
      date: "2026-11-08",
      dateText: "08/11/2026",
      payerId: "user-b",
      participantIds: [VIEWER, "user-b"],
      splitMode: "equal",
      description: "Cena",
    });
    expect(values.splitValues.fixed).toEqual({
      [VIEWER]: "5.00",
      "user-b": "5.00",
    });
  });

  it("keeps the stored percentage of its mode", () => {
    const values = loadValues({
      splitMode: "percentage",
      participants: [
        { userId: VIEWER, shareCents: 700, percentageBps: 7000 },
        { userId: "user-b", shareCents: 300, percentageBps: 3000 },
      ],
    });

    expect(values.splitMode).toBe("percentage");
    expect(values.splitValues.percentage).toEqual({
      [VIEWER]: "70",
      "user-b": "30",
    });
  });

  it("maps the weights of a shares expense", () => {
    const values = loadValues({
      splitMode: "shares",
      participants: [
        { userId: VIEWER, shareCents: 667, weight: 2 },
        { userId: "user-b", shareCents: 333, weight: 1 },
      ],
    });

    expect(values.splitValues.shares).toEqual({
      [VIEWER]: "2",
      "user-b": "1",
    });
  });

  it("drops stored participants that are no longer members", () => {
    const values = loadValues({
      participants: [
        { userId: VIEWER, shareCents: 500 },
        { userId: "user-z", shareCents: 500 },
      ],
    });

    expect(values.participantIds).toEqual([VIEWER]);
  });

  it("falls back to the viewer when the stored payer is no longer a member", () => {
    const values = loadValues({ payerId: "user-z" });

    expect(values.payerId).toBe(VIEWER);
  });
});
