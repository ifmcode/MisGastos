import { describe, expect, it } from "@jest/globals";

import {
  getGroupExpenseParticipantIds,
  readGroupExpenseIds,
  toggleGroupExpenseParticipant,
} from "../group-expense-participants";
import { buildFormValues, VIEWER } from "./group-expense-ui.test-helpers";

describe("readGroupExpenseIds", () => {
  it("trims, drops blanks and defensive non-strings, keeping order", () => {
    expect(
      readGroupExpenseIds([
        " user-a ",
        "",
        null as unknown as string,
        "user-b",
        "user-a",
      ]),
    ).toEqual(["user-a", "user-b"]);
  });
});

describe("toggleGroupExpenseParticipant", () => {
  it("removes and re-adds a participant keeping the member order", () => {
    const without = toggleGroupExpenseParticipant(buildFormValues(), "user-b");

    expect(without.participantIds).toEqual([VIEWER, "user-c"]);

    const back = toggleGroupExpenseParticipant(without, "user-b");

    expect(back.participantIds).toEqual([VIEWER, "user-b", "user-c"]);
  });

  it("allows excluding the payer from the participants", () => {
    const values = toggleGroupExpenseParticipant(buildFormValues(), VIEWER);

    expect(values.participantIds).toEqual(["user-b", "user-c"]);
    expect(values.payerId).toBe(VIEWER);
  });

  it("ignores a non-member or a blank id", () => {
    const values = buildFormValues();

    expect(toggleGroupExpenseParticipant(values, "user-z")).toBe(values);
    expect(toggleGroupExpenseParticipant(values, "  ")).toBe(values);
    expect(
      toggleGroupExpenseParticipant(values, null as unknown as string),
    ).toBe(values);
  });
});

describe("getGroupExpenseParticipantIds", () => {
  it("drops unknown ids and keeps the member order", () => {
    expect(
      getGroupExpenseParticipantIds(
        buildFormValues({ participantIds: ["user-c", "user-z", VIEWER] }),
      ),
    ).toEqual([VIEWER, "user-c"]);
  });
});
