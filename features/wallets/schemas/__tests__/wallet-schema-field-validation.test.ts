import { describe, expect, it } from "@jest/globals";

import {
  WALLET_DESCRIPTION_MAX_LENGTH,
  WALLET_NAME_MAX_LENGTH,
} from "../wallet.schema";
import { getIssues, inputWith } from "./wallet-schema.test-helpers";

describe("validateWalletInput field rules", () => {
  it("requires a name and enforces its maximum length", () => {
    expect(getIssues(inputWith({ name: "   " }))).toEqual([
      expect.objectContaining({ field: "name", code: "NAME_REQUIRED" }),
    ]);

    expect(
      getIssues(
        inputWith({ name: "a".repeat(WALLET_NAME_MAX_LENGTH + 1) }),
      ),
    ).toEqual([
      expect.objectContaining({ field: "name", code: "NAME_TOO_LONG" }),
    ]);
  });

  it("rejects unsupported currencies, icons, colors and types", () => {
    const issues = getIssues(
      inputWith({
        currency: "BTC",
        icon: "rocket",
        color: "blue",
        type: "credit",
      }),
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "currency", code: "INVALID_CURRENCY" }),
        expect.objectContaining({ field: "icon", code: "INVALID_ICON" }),
        expect.objectContaining({ field: "color", code: "INVALID_COLOR" }),
        expect.objectContaining({ field: "type", code: "INVALID_TYPE" }),
      ]),
    );
  });

  it("rejects negative initial balances", () => {
    expect(getIssues(inputWith({ initialBalance: -10 }))).toEqual([
      expect.objectContaining({
        field: "initialBalance",
        code: "NEGATIVE_AMOUNT",
      }),
    ]);

    expect(getIssues(inputWith({ initialBalance: "-10,50" }))).toEqual([
      expect.objectContaining({
        field: "initialBalance",
        code: "NEGATIVE_AMOUNT",
      }),
    ]);
  });

  it("rejects malformed initial balances", () => {
    const invalidValues = ["abc", "10,555", "1.234,56", "1e3", ".5"];

    for (const initialBalance of invalidValues) {
      expect(getIssues(inputWith({ initialBalance }))).toEqual([
        expect.objectContaining({
          field: "initialBalance",
          code: "INVALID_AMOUNT",
        }),
      ]);
    }
  });

  it("rejects a non-boolean includeInTotal flag", () => {
    expect(getIssues(inputWith({ includeInTotal: null }))).toEqual([
      expect.objectContaining({
        field: "includeInTotal",
        code: "INVALID_INCLUDE_IN_TOTAL",
      }),
    ]);
  });

  it("rejects descriptions over the maximum length", () => {
    expect(
      getIssues(
        inputWith({
          description: "a".repeat(WALLET_DESCRIPTION_MAX_LENGTH + 1),
        }),
      ),
    ).toEqual([
      expect.objectContaining({
        field: "description",
        code: "DESCRIPTION_TOO_LONG",
      }),
    ]);
  });
});
