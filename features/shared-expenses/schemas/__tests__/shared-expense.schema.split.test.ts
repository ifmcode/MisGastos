import { describe, expect, it } from "@jest/globals";

import { issuesOf } from "./shared-expense-input.test-helpers";

describe("validateSharedExpenseInput - split errors", () => {
  it("propagates an unparseable percentage", () => {
    expect(
      issuesOf({
        splitMode: "percentage",
        participants: [
          { userId: "user-a", value: "x" },
          { userId: "user-b", value: "50" },
        ],
      }),
    ).toEqual([{ field: "participants", code: "INVALID_PERCENTAGE" }]);
  });

  it("propagates an unparseable fixed amount", () => {
    expect(
      issuesOf({
        splitMode: "fixed",
        participants: [
          { userId: "user-a", value: "3,5,5" },
          { userId: "user-b", value: "6.50" },
        ],
      }),
    ).toEqual([{ field: "participants", code: "INVALID_FIXED_AMOUNT" }]);
  });

  it("propagates an unparseable weight", () => {
    expect(
      issuesOf({
        splitMode: "shares",
        participants: [
          { userId: "user-a", value: "1.5" },
          { userId: "user-b", value: "3" },
        ],
      }),
    ).toEqual([{ field: "participants", code: "INVALID_SHARES" }]);
  });

  it("propagates the split sum codes", () => {
    expect(
      issuesOf({
        splitMode: "percentage",
        participants: [
          { userId: "user-a", value: "30" },
          { userId: "user-b", value: "30" },
        ],
      }),
    ).toEqual([{ field: "participants", code: "PERCENTAGE_SUM_MISMATCH" }]);
    expect(
      issuesOf({
        splitMode: "fixed",
        participants: [
          { userId: "user-a", value: "3.50" },
          { userId: "user-b", value: "3.50" },
        ],
      }),
    ).toEqual([{ field: "participants", code: "FIXED_SUM_MISMATCH" }]);
    expect(
      issuesOf({
        splitMode: "shares",
        participants: [
          { userId: "user-a", value: "0" },
          { userId: "user-b", value: "0" },
        ],
      }),
    ).toEqual([{ field: "participants", code: "SHARES_SUM_INVALID" }]);
  });
});
