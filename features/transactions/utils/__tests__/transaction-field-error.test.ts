import { describe, expect, it } from "@jest/globals";

import type { Translate } from "@/shared/i18n/translate";

import {
  getFirstTransactionFieldError,
  getTransactionFieldErrorText,
} from "../transaction-field-error";

const translate: Translate = (key, options) =>
  options ? `${key}:${JSON.stringify(options)}` : key;

describe("getTransactionFieldErrorText", () => {
  it("uses the dedicated copy for a missing category", () => {
    expect(getTransactionFieldErrorText("CATEGORY_REQUIRED", translate)).toBe(
      "form.selectCategoryRequired",
    );
  });

  it("falls back to the shared validation namespace", () => {
    expect(getTransactionFieldErrorText("INVALID_CATEGORY", translate)).toBe(
      "validation:transactions.INVALID_CATEGORY",
    );
    expect(getTransactionFieldErrorText("WALLET_REQUIRED", translate)).toBe(
      "validation:transactions.WALLET_REQUIRED",
    );
  });
});

describe("getFirstTransactionFieldError", () => {
  it("returns the first collected code", () => {
    expect(
      getFirstTransactionFieldError({
        categoryId: "CATEGORY_REQUIRED",
        amount: "INVALID_AMOUNT",
      }),
    ).toBe("CATEGORY_REQUIRED");
  });

  it("returns null when there is no field error", () => {
    expect(getFirstTransactionFieldError({})).toBeNull();
    expect(
      getFirstTransactionFieldError({ amount: undefined, notes: undefined }),
    ).toBeNull();
  });
});
