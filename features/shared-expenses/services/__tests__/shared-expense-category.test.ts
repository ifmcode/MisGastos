import { describe, expect, it } from "@jest/globals";

import { getSharedExpenseCategoryId } from "../shared-expense-category";

describe("getSharedExpenseCategoryId", () => {
  it("builds the deterministic id used across devices", () => {
    expect(getSharedExpenseCategoryId("user-a")).toBe("user-a__shared-expense");
  });
});
