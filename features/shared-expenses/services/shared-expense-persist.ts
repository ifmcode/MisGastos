import type { IFriendsRepository } from "@/features/friends/repositories/friends.repository";
import { createFriendPairId } from "@/features/friends/utils/friend-pair";

import type {
  CreateSharedExpenseDto,
  UpdateSharedExpenseDto,
  ValidatedSharedExpense,
} from "../types/shared-expense.types";
import { SharedExpenseOperationError } from "./shared-expense.errors";

/**
 * The 1:1 slice only shares with an accepted friend; groups arrive with
 * TICKET-008. The deterministic pair id keeps the check to one document read.
 */
export async function assertSharedExpenseFriendship(
  friendsRepository: IFriendsRepository,
  viewerUid: string,
  participantIds: readonly string[],
): Promise<void> {
  const friendUid = participantIds.find((uid) => uid !== viewerUid) ?? "";
  const pairId = createFriendPairId(viewerUid, friendUid);

  if (pairId.length === 0) {
    throw new SharedExpenseOperationError("NOT_FRIEND");
  }

  const friendship = await friendsRepository.getFriendship(pairId);

  if (!friendship) throw new SharedExpenseOperationError("NOT_FRIEND");
}

export function buildCreateSharedExpenseDto(
  value: ValidatedSharedExpense,
  viewerUid: string,
  now: string,
): CreateSharedExpenseDto {
  return {
    ...value,
    pairId: value.participantIds.join("__"),
    createdBy: viewerUid,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

/** Only the mutable fields travel: the pair and the creation stamp are fixed. */
export function buildUpdateSharedExpenseDto(
  value: ValidatedSharedExpense,
  now: string,
): UpdateSharedExpenseDto {
  return {
    payerId: value.payerId,
    amountCents: value.amountCents,
    currency: value.currency,
    splitMode: value.splitMode,
    participants: value.participants,
    description: value.description,
    date: value.date,
    updatedAt: now,
  };
}
