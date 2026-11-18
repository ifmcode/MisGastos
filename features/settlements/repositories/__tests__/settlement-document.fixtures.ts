import type {
  CreateSettlementDto,
  Settlement,
  UpdateSettlementDto,
} from "../../types/settlement.types";

/** Valid `settlements` document payload; override only what the test asserts. */
export function buildSettlementDocument(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    participantIds: ["user-a", "user-b"],
    pairId: "user-a__user-b",
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
    ...overrides,
  };
}

export function buildSettlement(overrides: Partial<Settlement> = {}): Settlement {
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
    ...overrides,
  };
}

export function buildCreateSettlementDto(
  overrides: Partial<CreateSettlementDto> = {},
): CreateSettlementDto {
  return {
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
    ...overrides,
  };
}

export function buildSettlementUpdateDto(
  overrides: Partial<UpdateSettlementDto> = {},
): UpdateSettlementDto {
  return {
    amountCents: 2000,
    date: "2026-11-11",
    note: "Lunch",
    updatedAt: "2026-11-11T10:00:00.000Z",
    receiverWalletId: null,
    receiverCategoryId: null,
    ...overrides,
  };
}
