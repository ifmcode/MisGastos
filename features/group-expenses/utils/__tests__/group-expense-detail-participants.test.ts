import { describe, expect, it } from "@jest/globals";

import type { CurrencyCode } from "@/shared/constants/currencies";
import type { Translate } from "@/shared/i18n/translate";

import type { GroupExpenseDetailContext } from "../group-expense-detail.types";
import { getGroupExpenseParticipantFields } from "../group-expense-detail";
import { buildExpense, buildMembers, VIEWER } from "./group-expense-ui.test-helpers";

const t: Translate = (key, options) =>
  options
    ? `${key}|${Object.values(options).map(String).join(",")}`
    : key;

const context: GroupExpenseDetailContext = {
  viewerUid: VIEWER,
  members: buildMembers(),
  formatCurrency: (value: number, currency: CurrencyCode) =>
    `${value.toFixed(2)} ${currency}`,
  formatDate: (isoDate) => `date:${isoDate}`,
  t,
};

describe("getGroupExpenseParticipantFields", () => {
  it("lists the viewer first and labels the payer", () => {
    const fields = getGroupExpenseParticipantFields(buildExpense(), context);

    expect(fields).toEqual([
      {
        key: VIEWER,
        label: "viewerName",
        value: "5.00 EUR",
      },
      {
        key: "user-b",
        label: "detail.participantPayerLabel|Beto",
        value: "5.00 EUR",
      },
    ]);
  });

  it("keeps the stored percentage and weight", () => {
    const percentage = getGroupExpenseParticipantFields(
      buildExpense({
        splitMode: "percentage",
        participants: [
          { userId: "user-b", shareCents: 700, percentageBps: 7000 },
          { userId: "user-c", shareCents: 300, percentageBps: 3000 },
        ],
      }),
      context,
    );
    const shares = getGroupExpenseParticipantFields(
      buildExpense({
        splitMode: "shares",
        participants: [
          { userId: "user-b", shareCents: 667, weight: 2 },
          { userId: "user-c", shareCents: 333, weight: 1 },
        ],
      }),
      context,
    );

    expect(percentage[0].value).toBe(
      "detail.participantSharePercent|7.00 EUR,70",
    );
    expect(shares[0].value).toBe("detail.participantShareWeight|6.67 EUR,2");
  });

  it("keeps a stored zero share visible", () => {
    const fields = getGroupExpenseParticipantFields(
      buildExpense({
        participants: [
          { userId: VIEWER, shareCents: 0 },
          { userId: "user-b", shareCents: 1000 },
        ],
      }),
      context,
    );

    expect(fields[0].value).toBe("0.00 EUR");
  });

  it("trims the viewer uid before matching the row", () => {
    const fields = getGroupExpenseParticipantFields(buildExpense(), {
      ...context,
      viewerUid: ` ${VIEWER} `,
    });

    expect(fields[0].key).toBe(VIEWER);
  });
});
