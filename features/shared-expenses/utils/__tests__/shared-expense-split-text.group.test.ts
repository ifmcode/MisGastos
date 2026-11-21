import { describe, expect, it } from "@jest/globals";

import { canReuseSplitValues } from "../shared-expense-split-text";

const IDS = ["user-a", "user-b"];

describe("canReuseSplitValues minParticipants", () => {
  it("keeps rejecting a single participant by default", () => {
    expect(
      canReuseSplitValues("fixed", "10", ["user-a"], { "user-a": "10.00" }),
    ).toBe(false);
  });

  it("accepts a single participant when the group form opts in", () => {
    expect(
      canReuseSplitValues("fixed", "10", ["user-a"], { "user-a": "10.00" }, 1),
    ).toBe(true);
    expect(
      canReuseSplitValues("fixed", "12", ["user-a"], { "user-a": "10.00" }, 1),
    ).toBe(false);
    expect(
      canReuseSplitValues(
        "percentage",
        "10",
        ["user-a"],
        { "user-a": "100" },
        1,
      ),
    ).toBe(true);
  });

  it("leaves the two-participant contract untouched when forwarded", () => {
    expect(
      canReuseSplitValues(
        "fixed",
        "10",
        IDS,
        { "user-a": "5.00", "user-b": "5.00" },
        1,
      ),
    ).toBe(true);
    expect(
      canReuseSplitValues(
        "shares",
        "10",
        IDS,
        { "user-a": "1", "user-b": "1" },
        1,
      ),
    ).toBe(true);
  });
});
