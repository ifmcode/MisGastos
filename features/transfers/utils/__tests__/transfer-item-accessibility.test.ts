import { describe, expect, it } from "@jest/globals";

import { Transfer } from "../../types/transfer.types";
import {
  EDIT_TRANSFER_HINT_KEY,
  getTransferEditLabel,
} from "../transfer-item-accessibility";

function buildTransfer(overrides: Partial<Transfer>): Transfer {
  return {
    id: "transfer-1",
    fromWalletId: "wallet-1",
    toWalletId: "wallet-2",
    amount: 10,
    currency: "EUR",
    date: "2026-10-29",
    ownerId: "user-1",
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T10:00:00.000Z",
    ...overrides,
  };
}

describe("getTransferEditLabel", () => {
  it("summarizes the transfer and announces the edit action", () => {
    expect(
      getTransferEditLabel(
        buildTransfer({}),
        "Efectivo",
        "Banco",
        "10,00 €",
        "29/10/2026",
      ),
    ).toEqual({
      key: "item.editLabel",
      values: {
        from: "Efectivo",
        to: "Banco",
        amount: "10,00 €",
        date: "29/10/2026",
      },
    });
  });
});

describe("EDIT_TRANSFER_HINT_KEY", () => {
  it("points to the edit/delete hint key", () => {
    expect(EDIT_TRANSFER_HINT_KEY).toBe("item.editHint");
  });
});
