import { describe, expect, it, jest } from "@jest/globals";

import { Transfer } from "../../types/transfer.types";
import { createTransferDialogActions } from "../transfer-dialog-actions";

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

describe("createTransferDialogActions", () => {
  it("opens the read-only detail of the selected transfer", () => {
    const openDetail = jest.fn();
    const actions = createTransferDialogActions({
      openDetail,
      closeDetail: jest.fn(),
      openEdit: jest.fn(),
    });
    const transfer = buildTransfer({});

    actions.openDetail(transfer);

    expect(openDetail).toHaveBeenCalledWith(transfer);
  });

  it("closes the detail before opening the shared edit form", () => {
    const calls: string[] = [];
    const actions = createTransferDialogActions({
      openDetail: jest.fn(),
      closeDetail: () => calls.push("closeDetail"),
      openEdit: () => calls.push("openEdit"),
    });

    actions.editFromDetail(buildTransfer({}));

    expect(calls).toEqual(["closeDetail", "openEdit"]);
  });
});
