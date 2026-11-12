import { describe, expect, it } from "@jest/globals";

import { WalletValidationError } from "../wallet.errors";
import { normalizeOwnerId, normalizeWalletId } from "../wallet-owner";

describe("wallet owner helpers", () => {
  it("trims the owner id and builds the action-specific message", () => {
    expect(normalizeOwnerId("  user-1  ", "crear")).toBe("user-1");

    try {
      normalizeOwnerId(" ", "crear una cartera");
      throw new Error("Expected a validation error");
    } catch (error) {
      expect(error).toBeInstanceOf(WalletValidationError);
      if (!(error instanceof WalletValidationError)) return;
      expect(error.fieldErrors.ownerId).toBe(
        "Debes iniciar sesión para crear una cartera.",
      );
    }
  });

  it("trims the wallet id and rejects a blank one", () => {
    expect(normalizeWalletId("  wallet-1  ")).toBe("wallet-1");

    try {
      normalizeWalletId(" ");
      throw new Error("Expected a validation error");
    } catch (error) {
      expect(error).toBeInstanceOf(WalletValidationError);
      if (!(error instanceof WalletValidationError)) return;
      expect(error.fieldErrors.walletId).toBe("Selecciona una cartera válida.");
    }
  });
});
