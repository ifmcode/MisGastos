import { describe, expect, it } from "@jest/globals";

import { Transfer } from "../../types/transfer.types";
import { sortTransfersByDate } from "../transfer-sort";

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

describe("sortTransfersByDate", () => {
  it("sorts by date descending and uses createdAt as tie-breaker", () => {
    const older = buildTransfer({
      id: "older",
      date: "2026-10-27",
    });
    const sameDayEarlier = buildTransfer({
      id: "same-day-earlier",
      date: "2026-10-29",
      createdAt: "2026-10-29T09:00:00.000Z",
    });
    const sameDayLater = buildTransfer({
      id: "same-day-later",
      date: "2026-10-29",
      createdAt: "2026-10-29T11:00:00.000Z",
    });

    expect(
      sortTransfersByDate([older, sameDayEarlier, sameDayLater]).map(
        (transfer) => transfer.id,
      ),
    ).toEqual(["same-day-later", "same-day-earlier", "older"]);
  });

  it("does not mutate the input array", () => {
    const transfers = [
      buildTransfer({ id: "older", date: "2026-10-27" }),
      buildTransfer({ id: "newer", date: "2026-10-29" }),
    ];
    const original = [...transfers];

    sortTransfersByDate(transfers);

    expect(transfers).toEqual(original);
  });
});
