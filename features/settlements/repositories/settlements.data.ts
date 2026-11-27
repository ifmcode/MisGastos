import type {
  CreateSettlementDto,
  UpdateSettlementDto,
} from "../types/settlement.types";
import { INITIAL_REVISION } from "@/shared/utils/revision";

/** Full document of a new settlement; every optional link stays explicit. */
export function toSettlementData(
  dto: CreateSettlementDto,
): Record<string, unknown> {
  return {
    participantIds: dto.participantIds,
    pairId: dto.pairId,
    fromUserId: dto.fromUserId,
    toUserId: dto.toUserId,
    amountCents: dto.amountCents,
    currency: dto.currency,
    date: dto.date,
    note: dto.note,
    createdBy: dto.createdBy,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    deletedAt: dto.deletedAt,
    receiverWalletId: dto.receiverWalletId,
    receiverCategoryId: dto.receiverCategoryId,
    receiverTransactionId: dto.receiverTransactionId,
    revision: INITIAL_REVISION,
  };
}

/**
 * Mutable slice of a settlement. `receiverTransactionId` travels only when the
 * caller supplies it (the link operations own it); otherwise the stored value
 * is left untouched. Firestore rejects `undefined`, so nulls are explicit.
 */
export function toSettlementUpdateData(
  update: UpdateSettlementDto,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    amountCents: update.amountCents,
    date: update.date,
    note: update.note,
    updatedAt: update.updatedAt,
    receiverWalletId: update.receiverWalletId,
    receiverCategoryId: update.receiverCategoryId,
  };

  if (update.receiverTransactionId !== undefined) {
    data.receiverTransactionId = update.receiverTransactionId;
  }

  return data;
}
