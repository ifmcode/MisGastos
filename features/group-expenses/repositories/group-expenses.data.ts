import type {
  CreateGroupExpenseDto,
  SharedExpenseParticipant,
  UpdateGroupExpenseDto,
} from "../types/group-expense.types";

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
    createdBy: dto.createdBy,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    deletedAt: dto.deletedAt,
  };
}

/** Mutable slice of a group expense: identity and stamps are never sent here. */
export function toGroupExpenseUpdateData(
  update: UpdateGroupExpenseDto,
): Record<string, unknown> {
  return {
    payerId: update.payerId,
    amountCents: update.amountCents,
    currency: update.currency,
    splitMode: update.splitMode,
    participants: update.participants.map(toParticipantData),
    description: update.description,
    date: update.date,
    updatedAt: update.updatedAt,
  };
}
