import { describe, expect, it } from "@jest/globals";

import { Wallet } from "../../types/wallet.types";
import {
  buildWalletFormValues,
  createWalletFormValues,
  getWalletIconName,
  getWalletTypeKey,
  isWalletIcon,
  isWalletType,
} from "../wallet-options";

const wallet: Wallet = {
  id: "wallet-1",
  name: "Cuenta principal",
  currency: "EUR",
  icon: "cash",
  color: "#0A7EA4",
  initialBalance: 100.5,
  balance: 100.5,
  type: "bank",
  includeInTotal: true,
  ownerId: "user-1",
  createdAt: "2026-10-28T10:00:00.000Z",
  updatedAt: "2026-10-28T10:00:00.000Z",
};

describe("wallet options", () => {
  it("builds form values with a comma decimal and optional description", () => {
    expect(buildWalletFormValues(wallet)).toMatchObject({
      initialBalance: "100,50",
      description: "",
      icon: "cash",
    });
    expect(
      buildWalletFormValues({ ...wallet, description: "Nómina" }).description,
    ).toBe("Nómina");
  });

  it("preselects the preferred currency and falls back to EUR", () => {
    expect(createWalletFormValues("USD")).toMatchObject({
      currency: "USD",
      name: "",
      type: "cash",
      includeInTotal: true,
    });
    expect(createWalletFormValues(undefined).currency).toBe("EUR");
    expect(createWalletFormValues("BTC").currency).toBe("EUR");
  });

  it("guards icons and types", () => {
    expect(isWalletIcon("cash")).toBe(true);
    expect(isWalletIcon("invalid")).toBe(false);
    expect(isWalletIcon(42)).toBe(false);
    expect(isWalletType("cash")).toBe(true);
    expect(isWalletType("other")).toBe(true);
    expect(isWalletType("invalid")).toBe(false);
  });

  it("falls back to the default icon and resolves labels", () => {
    expect(getWalletIconName("cash")).toBe("cash");
    expect(getWalletIconName("invalid")).toBe("wallet");
    expect(getWalletTypeKey("bank")).toBe("types.bank");
  });
});
