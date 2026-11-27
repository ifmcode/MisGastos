import type {
  CreateGroupExpenseDto,
  SharedExpenseParticipant,
  UpdateGroupExpenseDto,
} from "../types/group-expense.types";
import { INITIAL_REVISION } from "@/shared/utils/revision";

/** Drops `undefined` optionals: Firestore rejects undefined field values. */
function toParticipantData(
  participant: SharedExpenseParticipant,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    userId: participant.userId,
    shareCents: participant.shareCents,
  };

  if (participant.percentageBps !== undefined) {
    data.percentageBps = participant.percentageBps;
  }
  if (participant.weight !== undefined) data.weight = participant.weight;

  return data;
}

export function toGroupExpenseData(
  dto: CreateGroupExpenseDto,
): Record<string, unknown> {
  return {
    groupId: dto.groupId,
    payerId: dto.payerId,
    amountCents: dto.amountCents,
    currency: dto.currency,
    splitMode: dto.splitMode,
    participants: dto.participants.map(toParticipantData),
    description: dto.description,
    date: dto.date,
    walletId: dto.walletId,
    categoryId: dto.categoryId,
    linkedTransactionId: dto.linkedTransactionId,
    createdBy: dto.createdBy,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    deletedAt: dto.deletedAt,
    revision: INITIAL_REVISION,
  };
}

/**
 * Mutable slice of a group expense. `linkedTransactionId` travels only when the
 * caller supplies it (the link operations own it); otherwise the stored value
 * is left untouched.
 */
export function toGroupExpenseUpdateData(
  update: UpdateGroupExpenseDto,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    payerId: update.payerId,
    amountCents: update.amountCents,
    currency: update.currency,
    splitMode: update.splitMode,
    participants: update.participants.map(toParticipantData),
    description: update.description,
    date: update.date,
    walletId: update.walletId,
    categoryId: update.categoryId,
    updatedAt: update.updatedAt,
  };

  if (update.linkedTransactionId !== undefined) {
    data.linkedTransactionId = update.linkedTransactionId;
  }

  return data;
}
