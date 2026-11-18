import { getFriendPairMemberIds } from "@/features/friends/utils/friend-pair";

import type {
  CreateSettlementDto,
  Settlement,
  SettlementParticipants,
  UpdateSettlementDto,
  ValidatedSettlement,
} from "../types/settlement.types";
import { SettlementOperationError } from "./settlement.errors";

export function buildSettlementParticipantIds(
  viewerUid: string,
  friendUid: string,
): string[] {
  const participantIds = getFriendPairMemberIds(viewerUid, friendUid);

  if (participantIds.length !== 2) {
    throw new SettlementOperationError("FRIEND_NOT_FOUND");
  }

  return participantIds;
}

/** The other participant of a pair; an outsider is a permission failure. */
export function getSettlementRecipient(
  settlement: Settlement,
  actorUid: string,
): string {
  if (!settlement.participantIds.includes(actorUid)) {
    throw new SettlementOperationError("NOT_PARTICIPANT");
  }

  const recipient = settlement.participantIds.find((uid) => uid !== actorUid);

  if (!recipient) throw new SettlementOperationError("NOT_PARTICIPANT");

  return recipient;
}

/**
 * New settlement, already normalized. Only the creditor can own the income, so
 * a wallet sent by the debtor is dropped here; the service rejects it earlier
 * with a field error.
 */
export function buildCreateSettlementDto({
  value,
  participantIds,
  direction,
  viewerUid,
  now,
}: {
  value: ValidatedSettlement;
  participantIds: string[];
  direction: SettlementParticipants;
  viewerUid: string;
  now: string;
}): CreateSettlementDto {
  const walletId = direction.viewerIsCreditor ? value.walletId : null;

  return {
    pairId: participantIds.join("__"),
    participantIds,
    fromUserId: direction.fromUserId,
    toUserId: direction.toUserId,
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
export function buildUpdateSettlementDto({
  value,
  existing,
  viewerUid,
  now,
}: {
  value: ValidatedSettlement;
  existing: Settlement;
  viewerUid: string;
  now: string;
}): UpdateSettlementDto {
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

/**
 * The recipient can finish the follow-up only when they receive the money and
 * no income exists yet after the event.
 */
export function resolveCanLinkWallet({
  settlement,
  recipientUid,
  viewerIsCreditor,
  walletId,
}: {
  settlement: Settlement;
  recipientUid: string;
  viewerIsCreditor: boolean;
  walletId: string | null;
}): boolean {
  if (settlement.toUserId !== recipientUid) return false;

  const hasMovement = viewerIsCreditor
    ? walletId !== null
    : settlement.receiverTransactionId !== null;

  return !hasMovement;
}
