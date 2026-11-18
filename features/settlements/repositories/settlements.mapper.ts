import { isCurrencyCode } from "@/shared/constants/currencies";
import {
  createFriendPairId,
  isValidFriendPair,
} from "@/features/friends/utils/friend-pair";

import type { Settlement } from "../types/settlement.types";

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readTextOrNull(value: unknown): string | null {
  const text = readText(value);
  return text.length > 0 ? text : null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => readText(item))
    .filter((item) => item.length > 0);
}

function readInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

/**
 * Receiver link is all-or-nothing: no wallet, no category and no movement, or
 * the three of them. A partial link would leave an income nobody can revert.
 */
function hasConsistentReceiverLink(
  walletId: string | null,
  categoryId: string | null,
  transactionId: string | null,
): boolean {
  return (
    (walletId === null && categoryId === null && transactionId === null) ||
    (walletId !== null && categoryId !== null && transactionId !== null)
  );
}

/**
 * Converts a `settlements` document. Malformed records are dropped (null)
 * instead of breaking the ledger: a missing id, an unsorted pair, a `pairId`
 * that disagrees with the pair, a payer/receiver outside the pair, the same user
 * on both sides, a non-positive or non-integer amount, an invalid currency or a
 * partially set receiver link.
 */
export function mapSettlementDocument(
  id: string,
  data: Record<string, unknown>,
): Settlement | null {
  const settlementId = readText(id);
  if (settlementId.length === 0) return null;

  const participantIds = readStringArray(data.participantIds);
  if (!isValidFriendPair(participantIds)) return null;

  const pairId = createFriendPairId(participantIds[0], participantIds[1]);
  const storedPairId = readText(data.pairId);
  if (storedPairId.length > 0 && storedPairId !== pairId) return null;

  const fromUserId = readText(data.fromUserId);
  const toUserId = readText(data.toUserId);

  if (!participantIds.includes(fromUserId)) return null;
  if (!participantIds.includes(toUserId)) return null;
  if (fromUserId === toUserId) return null;

  const amountCents = readInteger(data.amountCents);
  if (amountCents === null || amountCents <= 0) return null;

  if (!isCurrencyCode(data.currency)) return null;

  const receiverWalletId = readTextOrNull(data.receiverWalletId);
  const receiverCategoryId = readTextOrNull(data.receiverCategoryId);
  const receiverTransactionId = readTextOrNull(data.receiverTransactionId);

  if (
    !hasConsistentReceiverLink(
      receiverWalletId,
      receiverCategoryId,
      receiverTransactionId,
    )
  ) {
    return null;
  }

  return {
    id: settlementId,
    pairId,
    participantIds,
    fromUserId,
    toUserId,
    amountCents,
    currency: data.currency,
    date: readText(data.date),
    note: readText(data.note),
    createdBy: readText(data.createdBy),
    createdAt: readText(data.createdAt),
    updatedAt: readText(data.updatedAt),
    deletedAt: readTextOrNull(data.deletedAt),
    receiverWalletId,
    receiverCategoryId,
    receiverTransactionId,
  };
}
