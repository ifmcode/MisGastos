import { describe, expect, it } from "@jest/globals";

import { Wallet } from "@/features/wallets/types/wallet.types";
import { TransferFormValues } from "../../types/transfer.types";
import { validateTransferForm } from "../validate-transfer-form";

const values: TransferFormValues = {
  fromWalletId: "wallet-1",
  toWalletId: "wallet-2",
  amount: "25,50",
  currency: "EUR",
  date: "29/10/2026",
  notes: "Ahorro",
};

const wallet = {
  id: "wallet-1",
  name: "Cuenta",
  currency: "EUR",
  icon: "wallet",
  color: "#0A7EA4",
  initialBalance: 100,
  balance: 100,
  type: "bank",
  includeInTotal: true,
  ownerId: "user-1",
  createdAt: "2026-10-29T10:00:00.000Z",
  updatedAt: "2026-10-29T10:00:00.000Z",
} as Wallet;

function validate(overrides: Partial<TransferFormValues> = {}, balance = 100) {
  return validateTransferForm({
    values: { ...values, ...overrides },
    fromWallet: wallet,
    availableSourceBalance: balance,
    currency: "EUR",
  });
}

describe("validateTransferForm", () => {
  it("returns the normalized transfer input", () => {
    const result = validate();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({ amount: 25.5, date: "2026-10-29" });
  });

  it("returns field errors before checking the balance", () => {
    const result = validate({ toWalletId: "wallet-1" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.toWalletId).toBeDefined();
  });

  it("rejects a missing source wallet", () => {
    const result = validateTransferForm({
      values,
      fromWallet: undefined,
      availableSourceBalance: 100,
      currency: "EUR",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.amount).toContain("Saldo insuficiente");
  });

  it("rejects amounts over the available balance", () => {
    const result = validate({ amount: "150" }, 100);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.amount).toContain("100,00");
  });
});
