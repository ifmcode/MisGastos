import { isCurrencyCode } from "@/shared/constants/currencies";
import { parseDateInput } from "@/shared/utils/date";

import { SETTLEMENT_AMOUNT_MAX_CENTS } from "../schemas/group-settlement-validation.types";
import type { GroupSettlement } from "../types/group-settlement.types";

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readTextOrNull(value: unknown): string | null {
  const text = readText(value);
  return text.length > 0 ? text : null;
}

function readInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

/** Exactly two unique ids, ascending, so `pairId` is deterministic. */
function readParticipantIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;

  const first = readText(value[0]);
  const second = readText(value[1]);

  if (first.length === 0 || second.length === 0) return null;
  if (first >= second) return null;

  return [first, second];
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
 * Converts a `groupSettlements` document. Malformed records are dropped (null)
 * instead of breaking the ledger: a missing id or group, a pair that is not
 * exactly two sorted ids, a `pairId` that disagrees with the pair, a
 * debtor/creditor outside the pair, the same user on both sides, a non-positive
 * or oversized amount, an invalid currency or date, a missing creation stamp or
 * a partially set receiver link.
 *
 * Group membership of `groupId`, `fromUserId` and `toUserId` is NOT checked
 * here (it needs a group read): the service owns it and the rules prove it.
 */
export function mapGroupSettlementDocument(
  id: string,
  data: Record<string, unknown>,
): GroupSettlement | null {
  const settlementId = readText(id);
  if (settlementId.length === 0) return null;

  const groupId = readText(data.groupId);
  if (groupId.length === 0) return null;

  const participantIds = readParticipantIds(data.participantIds);
  if (participantIds === null) return null;

  const pairId = participantIds.join("__");
  const storedPairId = readText(data.pairId);
  if (storedPairId.length > 0 && storedPairId !== pairId) return null;

  const fromUserId = readText(data.fromUserId);
  const toUserId = readText(data.toUserId);

  if (!participantIds.includes(fromUserId)) return null;
  if (!participantIds.includes(toUserId)) return null;
  if (fromUserId === toUserId) return null;

  const amountCents = readInteger(data.amountCents);
  if (
    amountCents === null ||
    amountCents <= 0 ||
    amountCents > SETTLEMENT_AMOUNT_MAX_CENTS
  ) {
    return null;
  }

  if (!isCurrencyCode(data.currency)) return null;

  const date = parseDateInput(readText(data.date));
  if (date === null) return null;

  const createdBy = readText(data.createdBy);
  const createdAt = readText(data.createdAt);
  if (createdBy.length === 0 || createdAt.length === 0) return null;

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
    groupId,
    participantIds,
    pairId,
    fromUserId,
    toUserId,
    amountCents,
    currency: data.currency,
    date,
    note: readText(data.note),
    createdBy,
    createdAt,
    updatedAt: readText(data.updatedAt),
    deletedAt: readTextOrNull(data.deletedAt),
    receiverWalletId,
    receiverCategoryId,
    receiverTransactionId,
  };
}
