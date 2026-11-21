import { describe, expect, it } from "@jest/globals";

import { getGroupExpenseInitialValues } from "../group-expense-form-load";
import {
  buildMembers,
  GROUP_ID,
  TODAY,
  VIEWER,
} from "./group-expense-ui.test-helpers";

const memberIds = buildMembers().map((member) => member.uid);

describe("getGroupExpenseInitialValues (create)", () => {
  it("builds the create defaults of the group", () => {
    const values = getGroupExpenseInitialValues({
      editingExpense: null,
      viewerUid: VIEWER,
      groupId: GROUP_ID,
      memberIds,
      groupCurrency: "USD",
      today: TODAY,
    });

    expect(values).toMatchObject({
      groupId: GROUP_ID,
      currency: "USD",
      date: TODAY,
      dateText: "10/11/2026",
      payerId: VIEWER,
      participantIds: memberIds,
      splitMode: "equal",
      amount: "",
      description: "",
    });
  });

  it("picks the first member as payer when the viewer is not one", () => {
    const values = getGroupExpenseInitialValues({
      editingExpense: null,
      viewerUid: "user-z",
      groupId: GROUP_ID,
      memberIds: ["user-b", "user-c"],
      groupCurrency: "EUR",
      today: TODAY,
    });

    expect(values.payerId).toBe("user-b");
    expect(values.participantIds).toEqual(["user-b", "user-c"]);
  });
});
