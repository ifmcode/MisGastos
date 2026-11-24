import { describe, expect, it } from "@jest/globals";

import { mapTransactionDocument } from "../transaction.mapper";

const baseData: Record<string, unknown> = {
  type: "expense",
  amount: 25.5,
  currency: "EUR",
  walletId: "  wallet-1  ",
  concept: "  Cena  ",
  categoryId: "cat-1",
  date: "29/10/2026",
  notes: "  Cumpleaños  ",
  ownerId: "owner-from-document",
  createdAt: "2026-10-29T10:00:00.000Z",
  updatedAt: "2026-10-29T11:00:00.000Z",
};

describe("mapTransactionDocument wallet names", () => {
  it("reads the stored revision and defaults a legacy document to zero", () => {
    expect(
      mapTransactionDocument("tx-1", { ...baseData, revision: 5 }, "user-1")
        ?.revision,
    ).toBe(5);
    expect(mapTransactionDocument("tx-1", baseData, "user-1")?.revision).toBe(0);
  });

  it("maps the stored name of an orphaned wallet", () => {
    const transaction = mapTransactionDocument(
      "tx-1",
      {
        ...baseData,
        walletId: "-1",
        walletName: "  [Eliminada] Cuenta principal  ",
      },
      "user-1",
    );

    expect(transaction).toMatchObject({
      walletId: "-1",
      walletName: "[Eliminada] Cuenta principal",
    });
  });

  it("omits the name for movements of active wallets", () => {
    const transaction = mapTransactionDocument("tx-1", baseData, "user-1");

    expect(transaction?.walletId).toBe("wallet-1");
    expect(transaction && "walletName" in transaction).toBe(false);
  });

  it("still rejects an empty wallet id", () => {
    expect(
      mapTransactionDocument(
        "tx-1",
        { ...baseData, walletId: "   " },
        "user-1",
      ),
    ).toBeNull();
  });
});

describe("mapTransactionDocument shared links and soft delete", () => {
  it("reads a trimmed shared expense id on expenses", () => {
    const transaction = mapTransactionDocument(
      "tx-1",
      { ...baseData, sharedExpenseId: "  expense-1  " },
      "user-1",
    );

    expect(transaction?.sharedExpenseId).toBe("expense-1");
    expect(transaction?.deletedAt).toBeNull();
  });

  it("drops the shared expense id on income movements", () => {
    const transaction = mapTransactionDocument(
      "tx-1",
      { ...baseData, type: "income", sharedExpenseId: "expense-1" },
      "user-1",
    );

    expect(transaction && "sharedExpenseId" in transaction).toBe(false);
  });

  it("keeps a soft delete stamp so the list can filter it", () => {
    const transaction = mapTransactionDocument(
      "tx-1",
      { ...baseData, deletedAt: " 2026-11-16T10:00:00.000Z " },
      "user-1",
    );

    expect(transaction?.deletedAt).toBe("2026-11-16T10:00:00.000Z");
  });

  it("treats an empty delete stamp as active", () => {
    const transaction = mapTransactionDocument(
      "tx-1",
      { ...baseData, deletedAt: "   " },
      "user-1",
    );

    expect(transaction?.deletedAt).toBeNull();
  });
});

describe("mapTransactionDocument group expense links", () => {
  it("reads a trimmed group expense id on expenses", () => {
    const transaction = mapTransactionDocument(
      "tx-1",
      { ...baseData, groupExpenseId: "  group-expense-1  " },
      "user-1",
    );

    expect(transaction?.groupExpenseId).toBe("group-expense-1");
  });

  it("drops the group expense id on income movements", () => {
    const transaction = mapTransactionDocument(
      "tx-1",
      { ...baseData, type: "income", groupExpenseId: "group-expense-1" },
      "user-1",
    );

    expect(transaction && "groupExpenseId" in transaction).toBe(false);
  });

  it("ignores an empty group expense id", () => {
    const transaction = mapTransactionDocument(
      "tx-1",
      { ...baseData, groupExpenseId: "   " },
      "user-1",
    );

    expect(transaction && "groupExpenseId" in transaction).toBe(false);
  });
});

describe("mapTransactionDocument settlement links", () => {  it("reads a trimmed settlement id on income movements", () => {
    const transaction = mapTransactionDocument(
      "tx-1",
      { ...baseData, type: "income", settlementId: "  settlement-1  " },
      "user-1",
    );

    expect(transaction?.settlementId).toBe("settlement-1");
  });

  it("drops the settlement id on expense movements", () => {
    const transaction = mapTransactionDocument(
      "tx-1",
      { ...baseData, settlementId: "settlement-1" },
      "user-1",
    );

    expect(transaction && "settlementId" in transaction).toBe(false);
  });

  it("ignores an empty settlement id", () => {
    const transaction = mapTransactionDocument(
      "tx-1",
      { ...baseData, type: "income", settlementId: "   " },
      "user-1",
    );

    expect(transaction && "settlementId" in transaction).toBe(false);
  });
});

describe("mapTransactionDocument group settlement links", () => {
  it("reads a trimmed group settlement id on income movements", () => {
    const transaction = mapTransactionDocument(
      "tx-1",
      { ...baseData, type: "income", groupSettlementId: "  group-settlement-1  " },
      "user-1",
    );

    expect(transaction?.groupSettlementId).toBe("group-settlement-1");
  });

  it("drops the group settlement id on expense movements", () => {
    const transaction = mapTransactionDocument(
      "tx-1",
      { ...baseData, groupSettlementId: "group-settlement-1" },
      "user-1",
    );

    expect(transaction && "groupSettlementId" in transaction).toBe(false);
  });

  it("ignores an empty group settlement id", () => {
    const transaction = mapTransactionDocument(
      "tx-1",
      { ...baseData, type: "income", groupSettlementId: "   " },
      "user-1",
    );

    expect(transaction && "groupSettlementId" in transaction).toBe(false);
  });
});

describe("mapTransactionDocument invalid documents", () => {
  it("drops an unknown type, a non-positive amount or an unknown currency", () => {
    expect(
      mapTransactionDocument("tx-1", { ...baseData, type: "transfer" }, "u"),
    ).toBeNull();
    expect(
      mapTransactionDocument("tx-1", { ...baseData, amount: 0 }, "u"),
    ).toBeNull();
    expect(
      mapTransactionDocument("tx-1", { ...baseData, amount: "10" }, "u"),
    ).toBeNull();
    expect(
      mapTransactionDocument("tx-1", { ...baseData, currency: "XYZ" }, "u"),
    ).toBeNull();
  });

  it("drops an empty concept or an invalid date", () => {
    expect(
      mapTransactionDocument("tx-1", { ...baseData, concept: "  " }, "u"),
    ).toBeNull();
    expect(
      mapTransactionDocument("tx-1", { ...baseData, date: "not-a-date" }, "u"),
    ).toBeNull();
  });
});
