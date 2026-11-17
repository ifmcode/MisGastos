import { describe, expect, it } from "@jest/globals";

import {
  SHARED_EXPENSE_DESCRIPTION_MAX_LENGTH,
  toSharedExpenseFieldErrors,
  validateSharedExpenseInput,
} from "../shared-expense.schema";
import { buildInput, issuesOf, participantRows, VIEWER } from "./shared-expense-input.test-helpers";

describe("validateSharedExpenseInput - field errors", () => {
  it("requires a description and caps its length", () => {
    expect(issuesOf({ description: "  " })).toEqual([
      { field: "description", code: "DESCRIPTION_REQUIRED" },
    ]);
    expect(issuesOf({ description: 42 as unknown as string })).toEqual([
      { field: "description", code: "DESCRIPTION_REQUIRED" },
    ]);
    expect(
      issuesOf({
        description: "a".repeat(SHARED_EXPENSE_DESCRIPTION_MAX_LENGTH + 1),
      }),
    ).toEqual([{ field: "description", code: "DESCRIPTION_TOO_LONG" }]);
  });

  it("validates the amount", () => {
    expect(issuesOf({ amount: "" })).toEqual([
      { field: "amount", code: "AMOUNT_REQUIRED" },
    ]);
    expect(issuesOf({ amount: "abc" })).toEqual([
      { field: "amount", code: "AMOUNT_INVALID" },
    ]);
    expect(issuesOf({ amount: "0" })).toEqual([
      { field: "amount", code: "AMOUNT_INVALID" },
    ]);
    expect(issuesOf({ amount: "1000000.01" })).toEqual([
      { field: "amount", code: "AMOUNT_TOO_HIGH" },
    ]);
  });

  it("validates date, currency and split mode", () => {
    expect(issuesOf({ date: "2026-02-30" })).toEqual([
      { field: "date", code: "DATE_INVALID" },
    ]);
    expect(issuesOf({ currency: "XYZ" })).toEqual([
      { field: "currency", code: "CURRENCY_INVALID" },
    ]);
    expect(issuesOf({ splitMode: "ratio" })).toEqual([
      { field: "splitMode", code: "SPLIT_MODE_INVALID" },
    ]);
  });

  it("requires exactly the viewer and the other friend", () => {
    expect(issuesOf({ participants: participantRows("user-a") })).toEqual([
      { field: "participants", code: "PARTICIPANTS_INVALID" },
    ]);
    expect(issuesOf({ participants: participantRows("user-a", " ") })).toEqual([
      { field: "participants", code: "PARTICIPANTS_INVALID" },
    ]);
    expect(
      issuesOf({ participants: participantRows("user-a", "user-a") }),
    ).toEqual([{ field: "participants", code: "PARTICIPANTS_INVALID" }]);
    expect(
      issuesOf({ participants: participantRows("user-a", "user-b") }, " "),
    ).toEqual([{ field: "participants", code: "PARTICIPANTS_INVALID" }]);
    expect(
      issuesOf({ participants: participantRows("user-a", "user-b") }, "user-c"),
    ).toEqual([{ field: "participants", code: "PARTICIPANTS_INVALID" }]);
    expect(issuesOf({ friendUid: "user-c" })).toEqual([
      { field: "participants", code: "PARTICIPANTS_INVALID" },
    ]);
    expect(issuesOf({ friendUid: VIEWER })).toEqual([
      { field: "participants", code: "PARTICIPANTS_INVALID" },
    ]);
    expect(
      issuesOf({
        participants: [
          { userId: 7 as unknown as string, value: "" },
          { userId: "user-b", value: "" },
        ],
      }),
    ).toEqual([{ field: "participants", code: "PARTICIPANTS_INVALID" }]);
  });

  it("requires a participant as payer", () => {
    expect(issuesOf({ payerId: "  " })).toEqual([
      { field: "payerId", code: "PAYER_REQUIRED" },
    ]);
    expect(issuesOf({ payerId: "user-c" })).toEqual([
      { field: "payerId", code: "PAYER_NOT_PARTICIPANT" },
    ]);
  });

  it("does not check the payer against invalid participants", () => {
    expect(
      issuesOf({ participants: participantRows("user-a"), payerId: "user-c" }),
    ).toEqual([{ field: "participants", code: "PARTICIPANTS_INVALID" }]);
  });

  it("collects every issue in display order", () => {
    expect(
      issuesOf({
        description: " ",
        amount: "",
        date: "",
        currency: "",
        splitMode: "",
        participants: participantRows("user-a"),
        payerId: "",
      }),
    ).toEqual([
      { field: "description", code: "DESCRIPTION_REQUIRED" },
      { field: "amount", code: "AMOUNT_REQUIRED" },
      { field: "date", code: "DATE_INVALID" },
      { field: "currency", code: "CURRENCY_INVALID" },
      { field: "splitMode", code: "SPLIT_MODE_INVALID" },
      { field: "participants", code: "PARTICIPANTS_INVALID" },
      { field: "payerId", code: "PAYER_REQUIRED" },
    ]);
  });

  it("appends the missing payer wallet after the other issues", () => {
    expect(issuesOf({ description: " ", walletId: "" })).toEqual([
      { field: "description", code: "DESCRIPTION_REQUIRED" },
      { field: "walletId", code: "WALLET_REQUIRED" },
    ]);
  });
});

describe("toSharedExpenseFieldErrors", () => {
  it("keeps the first code of every field", () => {
    expect(
      toSharedExpenseFieldErrors([
        { field: "participants", code: "PARTICIPANTS_INVALID" },
        { field: "participants", code: "INVALID_SHARES" },
        { field: "amount", code: "AMOUNT_REQUIRED" },
      ]),
    ).toEqual({
      participants: "PARTICIPANTS_INVALID",
      amount: "AMOUNT_REQUIRED",
    });
  });

  it("returns no entries without issues", () => {
    expect(toSharedExpenseFieldErrors([])).toEqual({});
  });

  it("reports the codes of a rejected payload", () => {
    const result = validateSharedExpenseInput(buildInput({ amount: "" }), VIEWER);

    expect(result.ok).toBe(false);
    expect(result.ok || result.error).toEqual([
      { field: "amount", code: "AMOUNT_REQUIRED" },
    ]);
  });
});
