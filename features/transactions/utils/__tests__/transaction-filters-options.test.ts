import { describe, expect, it } from "@jest/globals";

import {
  TRANSACTION_SORT_OPTIONS,
  TRANSACTION_TYPE_FILTER_OPTIONS,
} from "../transaction-filters-options";

describe("transaction filter options", () => {
  it("offers both sort orders", () => {
    expect(TRANSACTION_SORT_OPTIONS).toEqual([
      { value: "desc", labelKey: "filters.sortNewest" },
      { value: "asc", labelKey: "filters.sortOldest" },
    ]);
  });

  it("starts the type options with all", () => {
    expect(TRANSACTION_TYPE_FILTER_OPTIONS).toEqual([
      { value: "all", labelKey: "filters.allTypes" },
      { value: "expense", labelKey: "types.expense" },
      { value: "income", labelKey: "types.income" },
    ]);
  });
});
