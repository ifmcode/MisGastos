import { describe, expect, it } from "@jest/globals";

import { getGroupSettlementErrorCopyKey } from "../group-settlement-error-copy";

describe("getGroupSettlementErrorCopyKey", () => {
  it("routes the shared fallbacks to settlement-specific copy", () => {
    expect(getGroupSettlementErrorCopyKey("LOAD_FAILED")).toBe(
      "SETTLEMENT_LOAD_FAILED",
    );
    expect(getGroupSettlementErrorCopyKey("SAVE_FAILED")).toBe(
      "SETTLEMENT_SAVE_FAILED",
    );
    expect(getGroupSettlementErrorCopyKey("DELETE_FAILED")).toBe(
      "SETTLEMENT_DELETE_FAILED",
    );
    expect(getGroupSettlementErrorCopyKey("ALREADY_DELETED")).toBe(
      "SETTLEMENT_ALREADY_DELETED",
    );
  });

  it("keeps the settlement and shared codes unchanged", () => {
    expect(getGroupSettlementErrorCopyKey("NO_DEBT")).toBe("NO_DEBT");
    expect(getGroupSettlementErrorCopyKey("AMOUNT_LOCKED")).toBe(
      "AMOUNT_LOCKED",
    );
    expect(getGroupSettlementErrorCopyKey("VALIDATION")).toBe("VALIDATION");
  });
});
