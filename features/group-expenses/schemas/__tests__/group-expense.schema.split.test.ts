import { describe, expect, it } from "@jest/globals";

import { issuesOf } from "./group-expense-input.test-helpers";

describe("validateGroupExpenseInput split errors", () => {
  it("rejects fixed amounts that do not add up to the total", () => {
    expect(
      issuesOf({
        splitMode: "fixed",
        participants: [
          { userId: "user-a", value: "5.00" },
          { userId: "user-b", value: "4.00" },
        ],
      }),
    ).toEqual([{ field: "participants", code: "FIXED_SUM_MISMATCH" }]);
  });

  it("rejects unparseable fixed amounts and percentages", () => {
    expect(
      issuesOf({
        splitMode: "fixed",
        participants: [{ userId: "user-a", value: "abc" }],
      }),
    ).toEqual([{ field: "participants", code: "INVALID_FIXED_AMOUNT" }]);
    expect(
      issuesOf({
        splitMode: "percentage",
        participants: [{ userId: "user-a", value: "abc" }],
      }),
    ).toEqual([{ field: "participants", code: "INVALID_PERCENTAGE" }]);
  });

  it("rejects percentages that are not exactly 100%", () => {
    expect(
      issuesOf({
        splitMode: "percentage",
        participants: [
          { userId: "user-a", value: "60" },
          { userId: "user-b", value: "30" },
        ],
      }),
    ).toEqual([{ field: "participants", code: "PERCENTAGE_SUM_MISMATCH" }]);
  });

  it("rejects an empty or malformed share weight sum", () => {
    expect(
      issuesOf({
        splitMode: "shares",
        participants: [
          { userId: "user-a", value: "0" },
          { userId: "user-b", value: "0" },
        ],
      }),
    ).toEqual([{ field: "participants", code: "SHARES_SUM_INVALID" }]);
    expect(
      issuesOf({
        splitMode: "shares",
        participants: [{ userId: "user-a", value: "-1" }],
      }),
    ).toEqual([{ field: "participants", code: "INVALID_SHARES" }]);
  });

  it("keeps the largest-remainder rounding on a percentage split", () => {
    expect(
      issuesOf({
        amount: "10.01",
        splitMode: "percentage",
        participants: [
          { userId: "user-a", value: "70" },
          { userId: "user-b", value: "30" },
        ],
      }),
    ).toBe("ok");
  });

  it("rejects a lone percentage that is not the whole expense", () => {
    expect(
      issuesOf({
        splitMode: "percentage",
        participants: [{ userId: "user-b", value: "50" }],
      }),
    ).toEqual([{ field: "participants", code: "PERCENTAGE_SUM_MISMATCH" }]);
  });
});
