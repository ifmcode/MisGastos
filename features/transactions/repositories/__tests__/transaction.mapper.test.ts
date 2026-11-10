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
