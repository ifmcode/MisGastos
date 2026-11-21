import { describe, expect, it } from "@jest/globals";

import {
  createGroupExpenseFormValues,
  toGroupExpenseInput,
} from "../group-expense-form";
import type { GroupExpenseFormValues } from "../group-expense-form";
import { resolveGroupExpensePayer } from "../group-expense-participants";
import {
  buildFormValues,
  GROUP_ID,
  TODAY,
  VIEWER,
} from "./group-expense-ui.test-helpers";

describe("createGroupExpenseFormValues", () => {
  it("starts with every member selected, the viewer as payer and equal split", () => {
    const values = createGroupExpenseFormValues({
      viewerUid: VIEWER,
      groupId: GROUP_ID,
      memberIds: [VIEWER, "user-b", "user-c"],
      currency: "EUR",
      date: TODAY,
    });

    expect(values).toMatchObject({
      viewerUid: VIEWER,
      groupId: GROUP_ID,
      memberIds: [VIEWER, "user-b", "user-c"],
      description: "",
      amount: "",
      currency: "EUR",
      date: TODAY,
      dateText: "10/11/2026",
      payerId: VIEWER,
      participantIds: [VIEWER, "user-b", "user-c"],
      splitMode: "equal",
    });
    expect(values.splitValues).toEqual({
      equal: {},
      percentage: {},
      fixed: {},
      shares: {},
    });
  });

  it("deduplicates and trims the member ids", () => {
    const values = createGroupExpenseFormValues({
      viewerUid: VIEWER,
      groupId: GROUP_ID,
      memberIds: [" user-a ", "user-b", "user-a", ""],
      currency: "EUR",
      date: TODAY,
    });

    expect(values.memberIds).toEqual([VIEWER, "user-b"]);
    expect(values.participantIds).toEqual([VIEWER, "user-b"]);
  });
});

describe("resolveGroupExpensePayer", () => {
  it("keeps a payer that is still a member", () => {
    expect(resolveGroupExpensePayer("user-b", [VIEWER, "user-b"], VIEWER)).toBe(
      "user-b",
    );
  });

  it("falls back to the viewer and then to the first member", () => {
    expect(resolveGroupExpensePayer("user-z", [VIEWER, "user-b"], VIEWER)).toBe(
      VIEWER,
    );
    expect(resolveGroupExpensePayer("user-z", ["user-b"], VIEWER)).toBe(
      "user-b",
    );
    expect(resolveGroupExpensePayer("", [], VIEWER)).toBe("");
  });

  it("reads a defensive non-string payer and fallback", () => {
    expect(
      resolveGroupExpensePayer(
        null as unknown as string,
        ["user-b"],
        null as unknown as string,
      ),
    ).toBe("user-b");
  });
});

describe("toGroupExpenseInput", () => {
  it("only sends the selected participants with the active mode values", () => {
    const input = toGroupExpenseInput(
      buildFormValues({
        description: " Cena ",
        amount: "30.00",
        payerId: "user-b",
        participantIds: ["user-b", "user-c"],
        splitMode: "fixed",
        splitValues: {
          equal: {},
          percentage: {},
          fixed: { "user-b": "10.00", "user-c": "20.00" },
          shares: {},
        },
      }),
    );

    expect(input).toEqual({
      groupId: GROUP_ID,
      description: " Cena ",
      amount: "30.00",
      currency: "EUR",
      date: TODAY,
      payerId: "user-b",
      splitMode: "fixed",
      participants: [
        { userId: "user-b", value: "10.00" },
        { userId: "user-c", value: "20.00" },
      ],
    });
  });

  it("sends an empty value per participant in equal mode", () => {
    const input = toGroupExpenseInput(buildFormValues());

    expect(input.participants).toEqual([
      { userId: VIEWER, value: "" },
      { userId: "user-b", value: "" },
      { userId: "user-c", value: "" },
    ]);
  });

  it("treats a missing mode map as empty", () => {
    const values: GroupExpenseFormValues = {
      ...buildFormValues({ splitMode: "fixed" }),
      splitValues: {} as GroupExpenseFormValues["splitValues"],
    };
    const input = toGroupExpenseInput(values);

    expect(input.participants).toEqual([
      { userId: VIEWER, value: "" },
      { userId: "user-b", value: "" },
      { userId: "user-c", value: "" },
    ]);
  });
});
