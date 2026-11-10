import { describe, expect, it } from "@jest/globals";

import {
  getDeletedWalletName,
  isOrphanedWalletId,
  ORPHANED_WALLET_ID,
} from "../deleted-wallet";

describe("deleted wallet helpers", () => {
  it("uses a virtual wallet id that cannot collide with real ids", () => {
    expect(ORPHANED_WALLET_ID).toBe("-1");
    expect(isOrphanedWalletId(" -1 ")).toBe(true);
    expect(isOrphanedWalletId("wallet-1")).toBe(false);
  });

  it("prefixes the wallet name so history stays readable", () => {
    expect(getDeletedWalletName("  Cuenta principal  ")).toBe(
      "[Eliminada] Cuenta principal",
    );
  });

  it("does not duplicate the prefix on repeated deletions", () => {
    expect(getDeletedWalletName("[Eliminada] Cuenta principal")).toBe(
      "[Eliminada] Cuenta principal",
    );
  });
});
