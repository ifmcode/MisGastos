import { describe, expect, it } from "@jest/globals";

import type { CurrencyCode } from "@/shared/constants/currencies";
import type { Translate } from "@/shared/i18n/translate";

import type { GroupExpense } from "../../types/group-expense.types";
import type { GroupExpenseDetailContext } from "../group-expense-detail.types";
import { buildGroupExpenseDetailFields } from "../group-expense-detail-fields";
import { buildMembers, VIEWER } from "./group-expense-ui.test-helpers";

const t: Translate = (key, options) =>
  options ? `${key}|${String(options.count ?? "")}` : key;

const context: GroupExpenseDetailContext = {
  viewerUid: VIEWER,
  members: buildMembers(),
  formatCurrency: (value: number, currency: CurrencyCode) =>
    `${value} ${currency}`,
  formatDate: (isoDate) => `date:${isoDate}`,
  t,
};

const expense: GroupExpense = {
  id: "expense-1",
  groupId: "group-1",
  payerId: "user-b",
  amountCents: 1200,
  currency: "EUR",
  splitMode: "fixed",
  participants: [
    { userId: VIEWER, shareCents: 400 },
    { userId: "user-b", shareCents: 400 },
    { userId: "user-c", shareCents: 400 },
  ],
  description: "Cena",
  date: "2026-11-10",
  createdBy: VIEWER,
  createdAt: "2026-11-10T20:00:00.000Z",
  updatedAt: "2026-11-10T20:00:00.000Z",
  deletedAt: null,
};

describe("buildGroupExpenseDetailFields", () => {
  it("builds the rows in detail order", () => {
    const fields = buildGroupExpenseDetailFields(expense, "Viaje", context);

    expect(fields.map((field) => field.key)).toEqual([
      "group",
      "payer",
      "splitMode",
      "date",
      "participants",
    ]);
    expect(fields[0]).toEqual({
      key: "group",
      label: "detail.group",
      value: "Viaje",
    });
    expect(fields[1].value).toBe("Beto");
    expect(fields[2].value).toBe("detail.split.fixed");
    expect(fields[3].value).toBe("date:2026-11-10");
    expect(fields[4].value).toBe("detail.participantsCount|3");
  });

  it("labels the viewer when they paid", () => {
    const fields = buildGroupExpenseDetailFields(
      { ...expense, payerId: VIEWER },
      "Viaje",
      context,
    );

    expect(fields[1].value).toBe("viewerName");
  });
});
