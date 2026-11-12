import { describe, expect, it } from "@jest/globals";

import { WalletValidationError } from "../wallet.errors";
import { normalizeOwnerId, normalizeWalletId } from "../wallet-owner";

describe("wallet owner helpers", () => {
  it("trims the owner id and returns the OWNER_REQUIRED code", () => {
    expect(normalizeOwnerId("  user-1  ")).toBe("user-1");

    try {
      normalizeOwnerId(" ");
      throw new Error("Expected a validation error");
    } catch (error) {
      expect(error).toBeInstanceOf(WalletValidationError);
      if (!(error instanceof WalletValidationError)) return;
      expect(error.fieldErrors.ownerId).toBe("OWNER_REQUIRED");
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
      expect(error.fieldErrors.walletId).toBe("WALLET_REQUIRED");
    }
  });
});
