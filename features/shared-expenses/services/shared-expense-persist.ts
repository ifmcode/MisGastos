import type { IFriendsRepository } from "@/features/friends/repositories/friends.repository";
import { createFriendPairId } from "@/features/friends/utils/friend-pair";

import type {
  CreateSharedExpenseDto,
  SharedExpense,
  UpdateSharedExpenseDto,
  ValidatedSharedExpense,
} from "../types/shared-expense.types";
import { SharedExpenseOperationError } from "./shared-expense.errors";

/** Wallet link the service persists: `null` keeps the expense social-only. */
export interface ResolvedSharedExpenseLink {
  walletId: string | null;
  categoryId: string | null;
}

/**
 * Defense in depth for the wallet toggle: the schema already reports the missing
 * wallet (`WALLET_REQUIRED`), the missing category (`CATEGORY_REQUIRED`) and a
 * link that contradicts "No" (`LINK_WITHOUT_REGISTRATION`), so only a caller
 * that bypasses the form validation reaches this guard. TICKET-055 replaced
 * TICKET-048's mandatory payer wallet: a viewer-paid expense may now be
 * social-only, but a wallet and a category always travel together. Wallet
 * existence, ownership and currency stay inside the repository transaction.
 */
export function assertSharedExpenseLinkCoherence(
  value: ValidatedSharedExpense,
  viewerUid: string,
): void {
  if (value.walletId === null) {
    if (value.categoryId !== null || value.linkedTransactionId !== null) {
      throw new SharedExpenseOperationError("LINK_WITHOUT_REGISTRATION");
    }

    return;
  }

  // The other participant owns their movement, so the service drops the wallet
  // and the category of a friend-paid value instead of persisting them.
  if (value.payerId !== viewerUid) return;

  if (value.categoryId === null) {
    throw new SharedExpenseOperationError("CATEGORY_REQUIRED");
  }
}

/**
 * Only the payer can own the linked movement (rules require it), so a wallet
 * selected while someone else pays is dropped instead of persisted.
 */
export function resolveSharedExpenseLink(
  value: ValidatedSharedExpense,
  viewerUid: string,
): ResolvedSharedExpenseLink {
  const walletId =
    value.walletId !== null && value.payerId === viewerUid
      ? value.walletId
      : null;

  return walletId === null
    ? { walletId: null, categoryId: null }
    : { walletId, categoryId: value.categoryId };
}

/** A stored expense is linked when it has a wallet or a movement reference. */
export function isSharedExpenseLinked(expense: SharedExpense): boolean {
  return expense.walletId !== null || expense.linkedTransactionId !== null;
}

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
    walletId: value.walletId,
    categoryId: value.categoryId,
    updatedAt: now,
  };
}
