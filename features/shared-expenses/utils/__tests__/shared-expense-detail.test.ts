import { describe, expect, it } from "@jest/globals";

import type { Friend } from "@/features/friends/types/friend.types";
import type { Translate } from "@/shared/i18n/translate";

import type { SharedExpense } from "../../types/shared-expense.types";
import {
  buildSharedExpenseDetailFields,
  buildSharedExpenseLinkedMovementFields,
} from "../shared-expense-detail-fields";
import {
  findSharedExpenseForDetail,
  getSharedExpenseDetailSummary,
  getSharedExpenseParticipantFields,
  getSharedExpensePayerLabel,
  getSharedExpenseSplitModeLabel,
} from "../shared-expense-detail";
import type { SharedExpenseDetailContext } from "../shared-expense-detail.types";
import { buildSharedExpense } from "./shared-expense.fixtures";

function buildFriend(overrides: Partial<Friend> = {}): Friend {
  return {
    uid: "user-b",
    displayName: "Bea",
    email: "bea@example.com",
    balances: [],
    since: "2026-11-01T10:00:00.000Z",
    ...overrides,
  };
}

/** Deterministic fake: keys stay visible and interpolation values are joined. */
const t: Translate = (key, options) =>
  options ? `${key}:${Object.values(options).join("/")}` : key;
const formatCurrency = (value: number, currency: string) =>
  `${value} ${currency}`;
const formatDate = (isoDate: string) => `date ${isoDate}`;
const formatDateTime = (value: string) => `at ${value}`;

function buildContext(
  overrides: Partial<SharedExpenseDetailContext> = {},
): SharedExpenseDetailContext {
  return {
    viewerUid: "user-a",
    friends: [buildFriend()],
    formatCurrency,
    formatDate,
    formatDateTime,
    t,
    ...overrides,
  };
}

describe("getSharedExpenseDetailSummary", () => {
  it("shows the formatted total and the currency of the expense", () => {
    expect(
      getSharedExpenseDetailSummary(buildSharedExpense({}), formatCurrency, t),
    ).toEqual({
      label: "detail.summaryLabel",
      amount: "10 EUR",
      meta: "EUR",
      tone: "neutral",
    });
  });

  it("keeps integer cents exact for amounts with decimals", () => {
    expect(
      getSharedExpenseDetailSummary(
        buildSharedExpense({ amountCents: 1001 }),
        formatCurrency,
        t,
      ).amount,
    ).toBe("10.01 EUR");
  });
});

describe("getSharedExpensePayerLabel", () => {
  it("labels the viewer as the payer", () => {
    expect(getSharedExpensePayerLabel(buildSharedExpense({}), [], "user-a", t))
      .toBe("viewerName");
  });

  it("resolves the friend name of the payer", () => {
    expect(
      getSharedExpensePayerLabel(
        buildSharedExpense({ payerId: "user-b" }),
        [buildFriend()],
        "user-a",
        t,
      ),
    ).toBe("Bea");
  });

  it("falls back when the payer is no longer a friend", () => {
    expect(
      getSharedExpensePayerLabel(
        buildSharedExpense({ payerId: "user-b" }),
        [],
        "user-a",
        t,
      ),
    ).toBe("friendFallback");
  });
});

describe("getSharedExpenseSplitModeLabel", () => {
  it("maps every split mode to its copy key", () => {
    expect(getSharedExpenseSplitModeLabel("equal", t)).toBe(
      "detail.split.equal",
    );
    expect(getSharedExpenseSplitModeLabel("percentage", t)).toBe(
      "detail.split.percentage",
    );
    expect(getSharedExpenseSplitModeLabel("fixed", t)).toBe(
      "detail.split.fixed",
    );
    expect(getSharedExpenseSplitModeLabel("shares", t)).toBe(
      "detail.split.shares",
    );
  });
});

describe("getSharedExpenseParticipantFields", () => {
  it("renders one amount row per participant on an equal split", () => {
    expect(
      getSharedExpenseParticipantFields(buildSharedExpense({}), buildContext()),
    ).toEqual([
      { key: "user-a", label: "viewerName", value: "5 EUR" },
      { key: "user-b", label: "Bea", value: "5 EUR" },
    ]);
  });

  it("renders the stored percentage, including a zero share", () => {
    const expense = buildSharedExpense({
      splitMode: "percentage",
      participants: [
        { userId: "user-a", shareCents: 1000, percentageBps: 10000 },
        { userId: "user-b", shareCents: 0, percentageBps: 0 },
      ],
    });

    expect(
      getSharedExpenseParticipantFields(expense, buildContext()),
    ).toEqual([
      {
        key: "user-a",
        label: "viewerName",
        value: "detail.participantSharePercent:10 EUR/100",
      },
      {
        key: "user-b",
        label: "Bea",
        value: "detail.participantSharePercent:0 EUR/0",
      },
    ]);
  });

  it("renders legacy shares with their stored weight", () => {
    const expense = buildSharedExpense({
      splitMode: "shares",
      participants: [
        { userId: "user-a", shareCents: 667, weight: 2 },
        { userId: "user-b", shareCents: 333, weight: 1 },
      ],
    });

    expect(
      getSharedExpenseParticipantFields(expense, buildContext()).map(
        (field) => field.value,
      ),
    ).toEqual([
      "detail.participantShareWeight:6.67 EUR/2",
      "detail.participantShareWeight:3.33 EUR/1",
    ]);
  });

  it("renders fixed shares without a raw split value", () => {
    const expense = buildSharedExpense({
      splitMode: "fixed",
      participants: [
        { userId: "user-a", shareCents: 250 },
        { userId: "user-b", shareCents: 750 },
      ],
    });

    expect(
      getSharedExpenseParticipantFields(expense, buildContext()).map(
        (field) => field.value,
      ),
    ).toEqual(["2.5 EUR", "7.5 EUR"]);
  });

  it("puts the viewer first and keeps the stored order afterwards", () => {
    const expense = buildSharedExpense({
      participants: [
        { userId: "user-b", shareCents: 500 },
        { userId: "user-a", shareCents: 500 },
        { userId: "user-c", shareCents: 0 },
      ],
      participantIds: ["user-a", "user-b", "user-c"],
    });

    expect(
      getSharedExpenseParticipantFields(expense, buildContext()).map(
        (field) => field.key,
      ),
    ).toEqual(["user-a", "user-b", "user-c"]);
  });

  it("never mutates the stored participants", () => {
    const participants = [
      { userId: "user-b", shareCents: 500 },
      { userId: "user-a", shareCents: 500 },
    ];
    const expense = buildSharedExpense({ participants });

    getSharedExpenseParticipantFields(expense, buildContext());

    expect(participants.map((participant) => participant.userId)).toEqual([
      "user-b",
      "user-a",
    ]);
    expect(expense.participants).toBe(participants);
  });
});

describe("buildSharedExpenseLinkedMovementFields", () => {
  it("renders nothing while TICKET-044 is pending", () => {
    expect(buildSharedExpenseLinkedMovementFields(buildContext())).toEqual([]);
    expect(
      buildSharedExpenseLinkedMovementFields(
        buildContext({ linkedMovement: null }),
      ),
    ).toEqual([]);
  });

  it("renders the wallet when the movement label is missing", () => {
    expect(
      buildSharedExpenseLinkedMovementFields(
        buildContext({ linkedMovement: { walletName: "Cuenta" } }),
      ),
    ).toEqual([{ key: "wallet", label: "detail.wallet", value: "Cuenta" }]);

    expect(
      buildSharedExpenseLinkedMovementFields(
        buildContext({ linkedMovement: { walletName: "Cuenta", movementLabel: "  " } }),
      ),
    ).toHaveLength(1);
  });

  it("renders the wallet and the linked movement reference", () => {
    expect(
      buildSharedExpenseLinkedMovementFields(
        buildContext({
          linkedMovement: { walletName: "Cuenta", movementLabel: " Cena " },
        }),
      ),
    ).toEqual([
      { key: "wallet", label: "detail.wallet", value: "Cuenta" },
      { key: "linkedMovement", label: "detail.linkedMovement", value: "Cena" },
    ]);
  });
});

describe("buildSharedExpenseDetailFields", () => {
  it("lists every read-only row in the movement detail order", () => {
    const expense = buildSharedExpense({
      description: "Dinner",
      splitMode: "fixed",
      createdAt: "2026-11-10T20:00:00.000Z",
      updatedAt: "2026-11-11T09:30:00.000Z",
      participants: [
        { userId: "user-a", shareCents: 250 },
        { userId: "user-b", shareCents: 750 },
      ],
    });

    expect(
      buildSharedExpenseDetailFields(
        expense,
        buildContext({
          linkedMovement: { walletName: "Cuenta", movementLabel: "Cena" },
        }),
      ),
    ).toEqual([
      { key: "description", label: "detail.description", value: "Dinner" },
      { key: "total", label: "detail.total", value: "10 EUR" },
      { key: "currency", label: "detail.currency", value: "EUR" },
      { key: "date", label: "detail.date", value: "date 2026-11-10" },
      { key: "payer", label: "detail.payer", value: "viewerName" },
      { key: "splitMode", label: "detail.splitMode", value: "detail.split.fixed" },
      { key: "wallet", label: "detail.wallet", value: "Cuenta" },
      { key: "linkedMovement", label: "detail.linkedMovement", value: "Cena" },
      { key: "creator", label: "detail.creator", value: "viewerName" },
      {
        key: "createdAt",
        label: "detail.createdAt",
        value: "at 2026-11-10T20:00:00.000Z",
      },
      {
        key: "updatedAt",
        label: "detail.updatedAt",
        value: "at 2026-11-11T09:30:00.000Z",
      },
    ]);
  });

  it("resolves a friend payer and creator with the safe fallback", () => {
    const expense = buildSharedExpense({ payerId: "user-b", createdBy: "user-x" });
    const values = buildSharedExpenseDetailFields(
      expense,
      buildContext(),
    ).filter((field) => field.key === "payer" || field.key === "creator");

    expect(values).toEqual([
      { key: "payer", label: "detail.payer", value: "Bea" },
      { key: "creator", label: "detail.creator", value: "friendFallback" },
    ]);
  });

  it("omits the wallet block until a movement is linked", () => {
    const keys = buildSharedExpenseDetailFields(
      buildSharedExpense({}),
      buildContext(),
    ).map((field) => field.key);

    expect(keys).toEqual([
      "description",
      "total",
      "currency",
      "date",
      "payer",
      "splitMode",
      "creator",
      "createdAt",
      "updatedAt",
    ]);
  });
});

describe("findSharedExpenseForDetail", () => {
  const expense: SharedExpense = buildSharedExpense({ id: "expense-1" });

  it("finds the expense by its trimmed id", () => {
    expect(findSharedExpenseForDetail([expense], "  expense-1  ")).toBe(expense);
  });

  it("returns null for an empty id", () => {
    expect(findSharedExpenseForDetail([expense], "   ")).toBeNull();
    expect(findSharedExpenseForDetail([expense], "")).toBeNull();
  });

  it("returns null for an unknown or deleted id", () => {
    expect(findSharedExpenseForDetail([expense], "expense-2")).toBeNull();
    expect(findSharedExpenseForDetail([], "expense-1")).toBeNull();
  });

  it("does not mutate the list", () => {
    const expenses = [expense, buildSharedExpense({ id: "expense-2" })];

    findSharedExpenseForDetail(expenses, "expense-2");

    expect(expenses.map((item) => item.id)).toEqual(["expense-1", "expense-2"]);
  });
});
