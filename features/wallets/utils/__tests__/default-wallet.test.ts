import { describe, expect, it } from "@jest/globals";

import {
  buildDefaultWalletDto,
  buildDefaultWalletId,
} from "../default-wallet";
import { DEFAULT_WALLET_FORM_VALUES } from "../wallet-options";

describe("buildDefaultWalletId", () => {
  it("is stable for the same owner", () => {
    expect(buildDefaultWalletId("user-1")).toBe(
      buildDefaultWalletId("user-1"),
    );
  });

  it("ignores surrounding whitespace", () => {
    expect(buildDefaultWalletId("  user-1  ")).toBe(
      buildDefaultWalletId("user-1"),
    );
  });

  it("never contains a slash, which Firestore forbids in document ids", () => {
    expect(buildDefaultWalletId("user/1")).not.toContain("/");
  });

  it("differs between owners", () => {
    expect(buildDefaultWalletId("user-1")).not.toBe(
      buildDefaultWalletId("user-2"),
    );
  });
});

describe("buildDefaultWalletDto", () => {
  it("reuses the create defaults for icon, colour, type and total", () => {
    const dto = buildDefaultWalletDto("Cartera principal", "USD");

    expect(dto).toMatchObject({
      currency: "USD",
      icon: DEFAULT_WALLET_FORM_VALUES.icon,
      color: DEFAULT_WALLET_FORM_VALUES.color,
      type: DEFAULT_WALLET_FORM_VALUES.type,
      includeInTotal: DEFAULT_WALLET_FORM_VALUES.includeInTotal,
    });
  });

  it("starts with an initial balance of 0 and trims the name", () => {
    const dto = buildDefaultWalletDto("  Cartera principal  ", "EUR");

    expect(dto.name).toBe("Cartera principal");
    expect(dto.initialBalance).toBe(0);
  });

  it("keeps a valid preferred currency", () => {
    expect(buildDefaultWalletDto("Main wallet", "USD").currency).toBe("USD");
  });

  it("falls back to EUR for a missing or invalid currency", () => {
    expect(buildDefaultWalletDto("Main wallet", undefined).currency).toBe(
      "EUR",
    );
    expect(buildDefaultWalletDto("Main wallet", "XYZ").currency).toBe("EUR");
    expect(buildDefaultWalletDto("Main wallet", 42).currency).toBe("EUR");
  });

  it("does not add a description", () => {
    expect(buildDefaultWalletDto("Main wallet", "EUR")).not.toHaveProperty(
      "description",
    );
  });
});
