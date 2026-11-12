import { describe, expect, it } from "@jest/globals";

import { Transfer } from "../../types/transfer.types";
import {
  getTransferHistoryEmptyCopy,
  getTransferHistoryItems,
} from "../transfer-history";

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

describe("getTransferHistoryItems", () => {
  it("keeps every non-deleted transfer once, newest first", () => {
    const older = buildTransfer({
      id: "older",
      date: "2026-10-27",
    });
    const newer = buildTransfer({
      id: "newer",
      date: "2026-10-30",
    });
    const deleted = buildTransfer({
      id: "deleted",
      date: "2026-10-31",
      deletedAt: "2026-10-31T10:00:00.000Z",
    });

    expect(
      getTransferHistoryItems([older, newer, older, deleted]).map(
        (transfer) => transfer.id,
      ),
    ).toEqual(["newer", "older"]);
  });

  it("returns an empty list when there are no visible transfers", () => {
    expect(getTransferHistoryItems([])).toEqual([]);
  });
});

describe("getTransferHistoryEmptyCopy", () => {
  it("points to the empty-state translation keys", () => {
    const copy = getTransferHistoryEmptyCopy();

    expect(copy.titleKey).toBe("emptyTitle");
    expect(copy.messageKey).toBe("emptyMessage");
  });
});
