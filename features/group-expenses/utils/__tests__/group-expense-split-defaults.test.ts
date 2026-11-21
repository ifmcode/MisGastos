import { describe, expect, it } from "@jest/globals";

import { refreshGroupSplitValueDefaults } from "../group-expense-split-defaults";
import { buildFormValues } from "./group-expense-ui.test-helpers";

describe("refreshGroupSplitValueDefaults", () => {
  it("leaves modes that still fit the selected participants untouched", () => {
    const values = buildFormValues({
      amount: "10.00",
      splitValues: {
        equal: {},
        percentage: {},
        fixed: { "user-a": "5.00", "user-b": "5.00" },
        shares: {},
      },
      participantIds: ["user-a", "user-b"],
    });

    expect(refreshGroupSplitValueDefaults(values).splitValues.fixed).toEqual(
      values.splitValues.fixed,
    );
  });

  it("gives a newly added participant a default weight and keeps typed weights", () => {
    const values = refreshGroupSplitValueDefaults(
      buildFormValues({
        amount: "10.00",
        splitValues: {
          equal: {},
          percentage: {},
          fixed: {},
          shares: { "user-a": "2", "user-b": "1" },
        },
      }),
    );

    expect(values.splitValues.shares).toEqual({
      "user-a": "2",
      "user-b": "1",
      "user-c": "1",
    });
  });

  it("regenerates the fixed rows when the filled selection no longer adds up", () => {
    const values = refreshGroupSplitValueDefaults(
      buildFormValues({
        amount: "10.00",
        splitValues: {
          equal: {},
          percentage: {},
          fixed: { "user-a": "5.00", "user-b": "5.00" },
          shares: {},
        },
      }),
    );

    expect(values.splitValues.fixed).toEqual({
      "user-a": "3.34",
      "user-b": "3.33",
      "user-c": "3.33",
    });
  });

  it("regenerates a mode whose rows no longer add up for the selection", () => {
    const values = refreshGroupSplitValueDefaults(
      buildFormValues({
        amount: "10.00",
        splitValues: {
          equal: {},
          percentage: {},
          fixed: { "user-a": "9.00", "user-b": "9.00" },
          shares: {},
        },
        participantIds: ["user-a", "user-b"],
      }),
    );

    expect(values.splitValues.fixed).toEqual({
      "user-a": "5.00",
      "user-b": "5.00",
    });
  });
});
