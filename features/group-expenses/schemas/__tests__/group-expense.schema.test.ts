import { describe, expect, it } from "@jest/globals";

import {
  GROUP_EXPENSE_AMOUNT_MAX_CENTS,
  GROUP_EXPENSE_DESCRIPTION_MAX_LENGTH,
  GROUP_EXPENSE_MAX_PARTICIPANTS,
  toGroupExpenseFieldErrors,
  validateGroupExpenseInput,
} from "../group-expense.schema";
import {
  GROUP_ID,
  MEMBERS,
  VIEWER,
  buildInput,
  participantRows,
} from "./group-expense-input.test-helpers";

function validate(overrides: Parameters<typeof buildInput>[0] = {}) {
  const result = validateGroupExpenseInput(
    buildInput(overrides),
    VIEWER,
    MEMBERS,
  );

  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
}

describe("validateGroupExpenseInput", () => {
  it("normalizes the selected participants into exact cents", () => {
    expect(validate()).toEqual({
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
    });
  });

  it("trims the group id, the date and a comma decimal amount", () => {
    const value = validate({
      groupId: ` ${GROUP_ID} `,
      amount: "10,50",
      date: "10/11/2026",
    });

    expect(value.groupId).toBe(GROUP_ID);
    expect(value.amountCents).toBe(1050);
    expect(value.date).toBe("2026-11-10");
  });

  it("accepts all active members as participants (the Todos default)", () => {
    const value = validate({
      participants: participantRows(...MEMBERS),
    });

    expect(value.participants.map((row) => row.userId)).toEqual([...MEMBERS]);
    expect(value.participants.map((row) => row.shareCents)).toEqual([334, 333, 333]);
  });

  it("charges the payer's full amount to a single selected participant", () => {
    const value = validate({ participants: participantRows("user-b") });

    expect(value.payerId).toBe("user-a");
    expect(value.participants).toEqual([
      { userId: "user-b", shareCents: 1000 },
    ]);
  });

  it("supports the four split modes on a single participant", () => {
    const percentage = validate({
      splitMode: "percentage",
      participants: [{ userId: "user-c", value: "100" }],
    });
    const fixed = validate({
      splitMode: "fixed",
      participants: [{ userId: "user-c", value: "10.00" }],
    });
    const shares = validate({
      splitMode: "shares",
      participants: [{ userId: "user-c", value: "2" }],
    });

    expect(percentage.participants).toEqual([
      { userId: "user-c", shareCents: 1000, percentageBps: 10000 },
    ]);
    expect(fixed.participants).toEqual([
      { userId: "user-c", shareCents: 1000 },
    ]);
    expect(shares.participants).toEqual([
      { userId: "user-c", shareCents: 1000, weight: 2 },
    ]);
  });

  it("rejects a viewer that is not an active group member", () => {
    const result = validateGroupExpenseInput(buildInput(), "user-z", MEMBERS);

    expect(result).toEqual({
      ok: false,
      error: [{ field: "groupId", code: "NOT_GROUP_MEMBER" }],
    });
  });

  it("rejects a blank viewer", () => {
    const result = validateGroupExpenseInput(buildInput(), "  ", MEMBERS);

    expect(result.ok).toBe(false);
  });
});

describe("toGroupExpenseFieldErrors", () => {
  it("keeps the first code per field", () => {
    expect(
      toGroupExpenseFieldErrors([
        { field: "amount", code: "AMOUNT_REQUIRED" },
        { field: "amount", code: "AMOUNT_INVALID" },
        { field: "participants", code: "PARTICIPANTS_REQUIRED" },
      ]),
    ).toEqual({
      amount: "AMOUNT_REQUIRED",
      participants: "PARTICIPANTS_REQUIRED",
    });
  });
});

describe("group expense schema limits", () => {
  it("re-exports the document limits mirrored by the rules", () => {
    expect(GROUP_EXPENSE_DESCRIPTION_MAX_LENGTH).toBe(120);
    expect(GROUP_EXPENSE_AMOUNT_MAX_CENTS).toBe(100_000_000);
    expect(GROUP_EXPENSE_MAX_PARTICIPANTS).toBe(20);
  });
});
