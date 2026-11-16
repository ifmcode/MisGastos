import { describe, expect, it } from "@jest/globals";

import {
  createSharedExpenseFormValues,
  getSharedExpenseParticipantIds,
  isPayerSelectable,
  resolvePayerId,
  toSharedExpenseInput,
  type SharedExpenseFormValues,
} from "../shared-expense-form";
import {
  fromSharedExpense,
  resolveExpenseFriendUid,
} from "../shared-expense-form-load";
import { buildSharedExpense } from "./shared-expense.fixtures";

function buildValues(
  overrides: Partial<SharedExpenseFormValues> = {},
): SharedExpenseFormValues {
  return {
    ...createSharedExpenseFormValues({
      viewerUid: "user-a",
      friendUid: "user-b",
      currency: "EUR",
      date: "2026-11-10",
    }),
    ...overrides,
  };
}

describe("createSharedExpenseFormValues", () => {
  it("starts empty with the viewer as payer and an equal split", () => {
    const values = buildValues();

    expect(values).toMatchObject({
      viewerUid: "user-a",
      friendUid: "user-b",
      description: "",
      amount: "",
      currency: "EUR",
      date: "2026-11-10",
      dateText: "10/11/2026",
      payerId: "user-a",
      splitMode: "equal",
    });
    expect(values.splitValues).toEqual({
      equal: {},
      percentage: {},
      fixed: {},
      shares: {},
    });
  });

  it("honours an explicit payer and currency", () => {
    const values = createSharedExpenseFormValues({
      viewerUid: "user-a",
      friendUid: "",
      currency: "USD",
      date: "2026-11-10",
      payerId: "",
    });

    expect(values.currency).toBe("USD");
    expect(values.payerId).toBe("");
    expect(values.dateText).toBe("10/11/2026");
  });
});

describe("getSharedExpenseParticipantIds", () => {
  it("returns the viewer and the friend once", () => {
    expect(getSharedExpenseParticipantIds(buildValues())).toEqual([
      "user-a",
      "user-b",
    ]);
  });

  it("trims values and drops empty or repeated ids", () => {
    expect(
      getSharedExpenseParticipantIds(
        buildValues({ viewerUid: " user-a ", friendUid: "user-a" }),
      ),
    ).toEqual(["user-a"]);
    expect(
      getSharedExpenseParticipantIds(
        buildValues({ viewerUid: "user-a", friendUid: " " }),
      ),
    ).toEqual(["user-a"]);
  });
});

describe("toSharedExpenseInput", () => {
  it("maps the active mode values into participant rows", () => {
    const values = buildValues({
      description: "Dinner",
      amount: "12,50",
      splitMode: "percentage",
      splitValues: {
        equal: {},
        percentage: { "user-a": "60", "user-b": "40" },
        fixed: {},
        shares: {},
      },
    });

    expect(toSharedExpenseInput(values)).toEqual({
      friendUid: "user-b",
      description: "Dinner",
      amount: "12,50",
      currency: "EUR",
      date: "2026-11-10",
      payerId: "user-a",
      splitMode: "percentage",
      participants: [
        { userId: "user-a", value: "60" },
        { userId: "user-b", value: "40" },
      ],
    });
  });

  it("sends empty values for an equal split", () => {
    expect(
      toSharedExpenseInput(buildValues({ amount: "10" })).participants,
    ).toEqual([
      { userId: "user-a", value: "" },
      { userId: "user-b", value: "" },
    ]);
  });

  it("leaves a missing participant value empty", () => {
    const values = buildValues({
      amount: "10",
      splitMode: "shares",
      splitValues: {
        equal: {},
        percentage: {},
        fixed: {},
        shares: { "user-a": "2" },
      },
    });

    expect(toSharedExpenseInput(values).participants).toEqual([
      { userId: "user-a", value: "2" },
      { userId: "user-b", value: "" },
    ]);
  });
});

describe("fromSharedExpense", () => {
  it("loads a percentage expense as bps text", () => {
    const expense = buildSharedExpense({
      splitMode: "percentage",
      participants: [
        { userId: "user-a", shareCents: 333, percentageBps: 3333 },
        { userId: "user-b", shareCents: 668, percentageBps: 6667 },
      ],
    });
    const values = fromSharedExpense(expense, "user-a");

    expect(values.friendUid).toBe("user-b");
    expect(values.amount).toBe("10.00");
    expect(values.dateText).toBe("10/11/2026");
    expect(values.splitMode).toBe("percentage");
    expect(values.splitValues.percentage).toEqual({
      "user-a": "33.33",
      "user-b": "66.67",
    });
    expect(values.splitValues.equal).toEqual({});
  });

  it("loads fixed cents and share weights", () => {
    const fixed = fromSharedExpense(
      buildSharedExpense({
        splitMode: "fixed",
        amountCents: 1001,
        participants: [
          { userId: "user-a", shareCents: 501 },
          { userId: "user-b", shareCents: 500 },
        ],
      }),
      "user-a",
    );

    expect(fixed.splitValues.fixed).toEqual({
      "user-a": "5.01",
      "user-b": "5.00",
    });

    const shares = fromSharedExpense(
      buildSharedExpense({
        splitMode: "shares",
        participants: [
          { userId: "user-a", shareCents: 333, weight: 1 },
          { userId: "user-b", shareCents: 667, weight: 2 },
        ],
      }),
      "user-a",
    );

    expect(shares.splitValues.shares).toEqual({
      "user-a": "1",
      "user-b": "2",
    });
  });

  it("leaves a missing share weight empty", () => {
    const expense = buildSharedExpense({
      splitMode: "shares",
      participants: [{ userId: "user-a", shareCents: 1000 }],
    });

    expect(
      fromSharedExpense(expense, "user-a").splitValues.shares["user-a"],
    ).toBe("");
  });

  it("resolves the friend from the viewer side of the pair", () => {
    const expense = buildSharedExpense();

    expect(fromSharedExpense(expense, "user-b").friendUid).toBe("user-a");
    expect(
      fromSharedExpense(expense, "user-a").payerId,
    ).toBe("user-a");
  });
});

describe("resolveExpenseFriendUid", () => {
  it("returns the other participant", () => {
    expect(resolveExpenseFriendUid(buildSharedExpense(), "user-b")).toBe(
      "user-a",
    );
  });

  it("returns the first participant when the viewer is not stored", () => {
    expect(resolveExpenseFriendUid(buildSharedExpense(), "user-c")).toBe(
      "user-a",
    );
  });

  it("returns an empty string when the pair only holds the viewer", () => {
    const expense = buildSharedExpense({
      participantIds: ["user-a"],
    });

    expect(resolveExpenseFriendUid(expense, "user-a")).toBe("");
  });
});

describe("payer helpers", () => {
  it("accepts only stored participants", () => {
    expect(isPayerSelectable("user-b", ["user-a", "user-b"])).toBe(true);
    expect(isPayerSelectable("user-c", ["user-a", "user-b"])).toBe(false);
  });

  it("falls back when the payer is no longer a participant", () => {
    expect(resolvePayerId("user-b", ["user-a"], "user-a")).toBe("user-a");
    expect(resolvePayerId("user-b", ["user-a", "user-b"], "user-a")).toBe(
      "user-b",
    );
  });
});
