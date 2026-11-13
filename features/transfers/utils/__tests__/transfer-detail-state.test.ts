import { describe, expect, it } from "@jest/globals";

import { Transfer } from "../../types/transfer.types";
import {
  findTransferForDetail,
  INITIAL_TRANSFER_DETAIL_STATE,
  transferDetailReducer,
} from "../transfer-detail-state";

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

describe("transferDetailReducer", () => {
  it("opens the detail view with the selected transfer", () => {
    expect(
      transferDetailReducer(INITIAL_TRANSFER_DETAIL_STATE, {
        type: "open",
        transferId: "transfer-1",
      }),
    ).toEqual({ selectedId: "transfer-1" });
  });

  it("replaces the selected transfer when another one is opened", () => {
    expect(
      transferDetailReducer(
        { selectedId: "transfer-1" },
        { type: "open", transferId: "transfer-2" },
      ),
    ).toEqual({ selectedId: "transfer-2" });
  });

  it("closes the detail view", () => {
    expect(
      transferDetailReducer({ selectedId: "transfer-1" }, { type: "close" }),
    ).toEqual(INITIAL_TRANSFER_DETAIL_STATE);
  });
});

describe("findTransferForDetail", () => {
  const transfers = [
    buildTransfer({ id: "transfer-1" }),
    buildTransfer({ id: "transfer-2" }),
  ];

  it("returns the selected transfer from the live collection", () => {
    expect(findTransferForDetail(transfers, "transfer-2")?.id).toBe(
      "transfer-2",
    );
  });

  it("returns null when no transfer is selected", () => {
    expect(findTransferForDetail(transfers, null)).toBeNull();
  });

  it("returns null when the transfer no longer exists", () => {
    expect(findTransferForDetail(transfers, "deleted")).toBeNull();
  });
});
