import { describe, expect, it } from "@jest/globals";

import {
  toGroupExpenseData,
  toGroupExpenseUpdateData,
} from "../group-expenses.data";
import { buildCreateDto, buildUpdateDto } from "./group-expense-document.fixtures";

describe("toGroupExpenseData", () => {
  it("copies the link keys of a new expense", () => {
    const data = toGroupExpenseData(
      buildCreateDto({
        walletId: "wallet-1",
        categoryId: "category-1",
        linkedTransactionId: "movement-1",
      }),
    );

    expect(data).toMatchObject({
      walletId: "wallet-1",
      categoryId: "category-1",
      linkedTransactionId: "movement-1",
    });
  });
});

describe("toGroupExpenseUpdateData", () => {
  it("always writes the wallet and category and leaves the movement id to persistence", () => {
    const data = toGroupExpenseUpdateData(
      buildUpdateDto({ walletId: "wallet-1", categoryId: "category-1" }),
    );

    expect(data).toMatchObject({
      walletId: "wallet-1",
      categoryId: "category-1",
    });
    expect(data).not.toHaveProperty("linkedTransactionId");
  });

  it("writes the movement id when the link operation supplies it", () => {
    expect(
      toGroupExpenseUpdateData(
        buildUpdateDto({
          walletId: "wallet-1",
          categoryId: "category-1",
          linkedTransactionId: "movement-1",
        }),
      ).linkedTransactionId,
    ).toBe("movement-1");

    expect(
      toGroupExpenseUpdateData(
        buildUpdateDto({
          walletId: null,
          categoryId: null,
          linkedTransactionId: null,
        }),
      ).linkedTransactionId,
    ).toBeNull();
  });
});
