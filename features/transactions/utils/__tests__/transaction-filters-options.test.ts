import { describe, expect, it } from "@jest/globals";

import {
  TRANSACTION_SORT_OPTIONS,
  TRANSACTION_TYPE_FILTER_OPTIONS,
} from "../transaction-filters-options";

describe("transaction filter options", () => {
  it("offers both sort orders", () => {
    expect(TRANSACTION_SORT_OPTIONS).toEqual([
      { value: "desc", label: "Más recientes primero" },
      { value: "asc", label: "Más antiguos primero" },
    ]);
  });

  it("starts the type options with all", () => {
    expect(TRANSACTION_TYPE_FILTER_OPTIONS).toEqual([
      { value: "all", label: "Todos" },
      { value: "expense", label: "Gasto" },
      { value: "income", label: "Ingreso" },
    ]);
  });
});
