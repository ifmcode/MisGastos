import { describe, expect, it } from "@jest/globals";

import {
  getTransfersEmptyMessage,
  TRANSFER_EMPTY_GUIDANCE,
} from "../dashboard-transfers-copy";

describe("getTransfersEmptyMessage", () => {
  it("points to the wallets tab when a transfer is possible", () => {
    expect(getTransfersEmptyMessage(true)).toBe(TRANSFER_EMPTY_GUIDANCE);
    expect(getTransfersEmptyMessage(true)).toContain("Carteras");
    expect(getTransfersEmptyMessage(true)).toContain("Transferir");
  });

  it("explains the wallet requirement when a transfer is not possible", () => {
    expect(getTransfersEmptyMessage(false)).toBe(
      "Necesitas al menos dos carteras con la misma moneda.",
    );
  });
});
