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
  walletId: null,
  categoryId: null,
  linkedTransactionId: null,
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

  it("appends the wallet and movement rows for the payer of a linked expense", () => {
    const fields = buildGroupExpenseDetailFields(
      {
        ...expense,
        payerId: VIEWER,
        walletId: "wallet-1",
        categoryId: "category-1",
        linkedTransactionId: "transaction-1",
      },
      "Viaje",
      {
        ...context,
        linkedMovement: {
          walletName: "Cuenta",
          movementLabel: "detail.linkedMovementValue",
        },
      },
    );

    expect(fields.map((field) => field.key)).toEqual([
      "group",
      "payer",
      "splitMode",
      "date",
      "participants",
      "wallet",
      "linkedMovement",
    ]);
    expect(fields[5]).toEqual({
      key: "wallet",
      label: "detail.wallet",
      value: "Cuenta",
    });
    expect(fields[6]).toEqual({
      key: "linkedMovement",
      label: "detail.linkedMovement",
      value: "detail.linkedMovementValue",
    });
  });

  it("never shows the link rows to a non-payer", () => {
    const fields = buildGroupExpenseDetailFields(
      {
        ...expense,
        payerId: "user-b",
        walletId: "wallet-1",
        linkedTransactionId: "transaction-1",
      },
      "Viaje",
      {
        ...context,
        linkedMovement: { walletName: "Cuenta", movementLabel: "Gasto" },
      },
    );

    expect(fields.map((field) => field.key)).not.toContain("wallet");
    expect(fields.map((field) => field.key)).not.toContain("linkedMovement");
  });

  it("hides the link rows when the screen resolved no movement", () => {
    const fields = buildGroupExpenseDetailFields(
      {
        ...expense,
        payerId: VIEWER,
        walletId: "wallet-1",
        linkedTransactionId: "transaction-1",
      },
      "Viaje",
      context,
    );

    expect(fields.map((field) => field.key)).not.toContain("wallet");
  });

  it("hides the link rows of a social-only expense", () => {
    const fields = buildGroupExpenseDetailFields(
      { ...expense, payerId: VIEWER },
      "Viaje",
      {
        ...context,
        linkedMovement: { walletName: "Cuenta", movementLabel: "Gasto" },
      },
    );

    expect(fields.map((field) => field.key)).not.toContain("wallet");
  });

  it("falls back when the movement label is missing", () => {
    const fields = buildGroupExpenseDetailFields(
      {
        ...expense,
        payerId: VIEWER,
        walletId: "wallet-1",
        linkedTransactionId: "transaction-1",
      },
      "Viaje",
      { ...context, linkedMovement: { walletName: "Cuenta" } },
    );

    expect(fields[5].value).toBe("Cuenta");
    expect(fields[6].value).toBe("detail.linkedMovementValue");
  });

  it("falls back to the translated labels of an unresolved link", () => {
    const fields = buildGroupExpenseDetailFields(
      {
        ...expense,
        payerId: VIEWER,
        walletId: "wallet-1",
        linkedTransactionId: "transaction-1",
      },
      "Viaje",
      {
        ...context,
        linkedMovement: { walletName: "  ", movementLabel: "" },
      },
    );

    expect(fields[5].value).toBe("detail.walletUnavailable");
    expect(fields[6].value).toBe("detail.linkedMovementValue");
  });
});
