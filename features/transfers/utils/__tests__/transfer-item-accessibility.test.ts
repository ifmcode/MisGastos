import { describe, expect, it } from "@jest/globals";

import { Transfer } from "../../types/transfer.types";
import {
  EDIT_TRANSFER_HINT_KEY,
  getTransferDetailLabel,
  getTransferEditLabel,
  OPEN_TRANSFER_DETAIL_HINT_KEY,
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

const values = {
  from: "Efectivo",
  to: "Banco",
  amount: "10,00 €",
  date: "29/10/2026",
};

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
    ).toEqual({ key: "item.editLabel", values });
  });
});

describe("getTransferDetailLabel", () => {
  it("summarizes the transfer and announces the detail action", () => {
    expect(
      getTransferDetailLabel(
        buildTransfer({}),
        "Efectivo",
        "Banco",
        "10,00 €",
        "29/10/2026",
      ),
    ).toEqual({ key: "item.detailLabel", values });
  });
});

describe("transfer card hint keys", () => {
  it("points to the edit/delete hint by default", () => {
    expect(EDIT_TRANSFER_HINT_KEY).toBe("item.editHint");
  });

  it("exposes the detail hint for rows that open the read-only view", () => {
    expect(OPEN_TRANSFER_DETAIL_HINT_KEY).toBe("item.detailHint");
  });
});
