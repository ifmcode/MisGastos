import { beforeEach, describe, expect, it } from "@jest/globals";

import { getTodayIsoDate } from "@/shared/utils/date";
import { Transfer } from "@/features/transfers/types/transfer.types";
import {
  rememberLastUsedDate,
  resetLastUsedDate,
} from "@/shared/utils/last-used-date-store";

import { buildTransferFormValues } from "../transfer-form-defaults";

function buildTransfer(overrides: Partial<Transfer>): Transfer {
  return {
    id: "transfer-1",
    fromWalletId: "wallet-eur",
    toWalletId: "wallet-eur-2",
    amount: 25.5,
    currency: "EUR",
    date: "2026-10-20",
    ownerId: "user-1",
    createdAt: "2026-10-20T10:00:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
    ...overrides,
  };
}

describe("buildTransferFormValues", () => {
  beforeEach(() => {
    resetLastUsedDate();
  });

  it("maps the edited transfer into form values", () => {
    const values = buildTransferFormValues(buildTransfer({}));

    expect(values).toEqual({
      fromWalletId: "wallet-eur",
      toWalletId: "wallet-eur-2",
      amount: "25.5",
      currency: "EUR",
      date: "2026-10-20",
      notes: "",
    });
  });

  it("keeps the notes of the edited transfer", () => {
    const values = buildTransferFormValues(
      buildTransfer({ notes: "Alquiler" }),
    );

    expect(values.notes).toBe("Alquiler");
  });

  it("starts a new transfer without wallets", () => {
    const values = buildTransferFormValues(null);

    expect(values.fromWalletId).toBe("");
    expect(values.toWalletId).toBe("");
    expect(values.amount).toBe("");
    expect(values.currency).toBe("EUR");
    expect(values.date).toBe(getTodayIsoDate());
    expect(values.notes).toBe("");
  });

  it("uses the preferred currency as the provisional currency", () => {
    expect(buildTransferFormValues(null, "USD").currency).toBe("USD");
  });

  it("uses the last used date for a new transfer", () => {
    rememberLastUsedDate("2020-01-15");

    expect(buildTransferFormValues(null).date).toBe("2020-01-15");
  });

  it("keeps the stored wallets and currency when editing", () => {
    const values = buildTransferFormValues(buildTransfer({}), "USD");

    expect(values.fromWalletId).toBe("wallet-eur");
    expect(values.toWalletId).toBe("wallet-eur-2");
    expect(values.currency).toBe("EUR");
  });
});
