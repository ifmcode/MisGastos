import type {
  CreateGroupSettlementDto,
  GroupSettlement,
  UpdateGroupSettlementDto,
  ValidatedGroupSettlement,
} from "../types/group-settlement.types";
import { GroupExpenseOperationError } from "./group-expense.errors";

/**
 * Sorted pair of the settlement. The order is semantic: the pair id and the
 * rules require `participantIds[0] < participantIds[1]`, while `fromUserId` and
 * `toUserId` carry the direction.
 */
export function buildGroupSettlementParticipantIds(
  fromUserId: string,
  toUserId: string,
): string[] {
  const from = fromUserId.trim();
  const to = toUserId.trim();

  if (from.length === 0 || to.length === 0 || from === to) {
    throw new GroupExpenseOperationError("DIRECTION_MISMATCH");
  }

  return from < to ? [from, to] : [to, from];
}

/** The other member of the pair: the notification recipient. */
export function getGroupSettlementCounterpart(
  settlement: Pick<GroupSettlement, "fromUserId" | "toUserId">,
  actorUid: string,
): string {
  if (actorUid === settlement.fromUserId) return settlement.toUserId;
  if (actorUid === settlement.toUserId) return settlement.fromUserId;

  throw new GroupExpenseOperationError("NOT_SETTLEMENT_PARTICIPANT");
}

/**
 * New settlement, already normalized. Only the creditor can own the income, so
 * a wallet sent by the debtor is dropped here; the service rejects it earlier
 * with a field error.
 */
export function buildCreateGroupSettlementDto({
  value,
  participantIds,
  viewerUid,
  now,
}: {
  value: ValidatedGroupSettlement;
  participantIds: string[];
  viewerUid: string;
  now: string;
}): CreateGroupSettlementDto {
  const viewerIsCreditor = value.toUserId === viewerUid;
  const walletId = viewerIsCreditor ? value.walletId : null;

  return {
    groupId: value.groupId,
    participantIds,
    pairId: participantIds.join("__"),
    fromUserId: value.fromUserId,
    toUserId: value.toUserId,
    amountCents: value.amountCents,
    currency: value.currency,
    date: value.date,
    note: value.note,
    createdBy: viewerUid,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    receiverWalletId: walletId,
    receiverCategoryId: walletId === null ? null : value.categoryId,
    receiverTransactionId: null,
  };
}

/**
 * Only mutable fields travel. A debtor edit keeps the stored receiver link: the
 * rules deny changing it and the creditor owns that movement.
 */
export function buildUpdateGroupSettlementDto({
  value,
  existing,
  viewerUid,
  now,
}: {
  value: ValidatedGroupSettlement;
  existing: GroupSettlement;
  viewerUid: string;
  now: string;
}): UpdateGroupSettlementDto {
  const viewerIsCreditor = existing.toUserId === viewerUid;
  const walletId = viewerIsCreditor ? value.walletId : existing.receiverWalletId;

  return {
    amountCents: value.amountCents,
    date: value.date,
    note: value.note,
    updatedAt: now,
    receiverWalletId: walletId,
    receiverCategoryId:
      walletId === null
        ? null
        : viewerIsCreditor
          ? value.categoryId
          : existing.receiverCategoryId,
  };
}
