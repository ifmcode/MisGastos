import type { Settlement } from "../../types/settlement.types";

/** Valid settlement; override only what the assertion needs. */
export function buildSettlement(
  overrides: Partial<Settlement> = {},
): Settlement {
  return {
    id: "settlement-1",
    pairId: "user-a__user-b",
    participantIds: ["user-a", "user-b"],
    fromUserId: "user-a",
    toUserId: "user-b",
    amountCents: 1000,
    currency: "EUR",
    date: "2026-11-10",
    note: "Dinner",
    createdBy: "user-a",
    createdAt: "2026-11-10T20:00:00.000Z",
    updatedAt: "2026-11-10T20:00:00.000Z",
    deletedAt: null,
    receiverWalletId: null,
    receiverCategoryId: null,
    receiverTransactionId: null,
    revision: 0,
    ...overrides,
  };
}
