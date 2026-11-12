import { describe, expect, it } from "@jest/globals";

import {
  getTransfersEmptyMessageKey,
  TRANSFER_EMPTY_GUIDANCE_KEY,
} from "../dashboard-transfers-copy";

describe("getTransfersEmptyMessageKey", () => {
  it("points to the wallets tab when a transfer is possible", () => {
    expect(getTransfersEmptyMessageKey(true)).toBe(
      TRANSFER_EMPTY_GUIDANCE_KEY,
    );
    expect(TRANSFER_EMPTY_GUIDANCE_KEY).toBe("transfers.guidance");
  });

  it("explains the wallet requirement when a transfer is not possible", () => {
    expect(getTransfersEmptyMessageKey(false)).toBe("transfers.requirement");
  });
});
