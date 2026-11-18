import type { Settlement, SettlementInput } from "../types/settlement.types";
import {
  canEditSettlementAmount,
  isSettlementFull,
} from "../utils/settlement-debt";
import { buildSettlementNotificationInput } from "../utils/settlement-notification";
import { SettlementOperationError } from "./settlement.errors";
import {
  assertCreditorWallet,
  assertSettlementDebtBound,
  assertSettlementParticipant,
  loadSettlementBalances,
  requireSettlement,
  validateSettlementOrThrow,
} from "./settlement-guards";
import {
  buildUpdateSettlementDto,
  getSettlementRecipient,
  resolveCanLinkWallet,
} from "./settlement-persist";
import type { SettlementWriteDeps } from "./settlement-write-deps";

/**
 * Edits amount, date, note and the creditor's own link. The currency, the pair
 * and the direction are immutable, and the amount is re-validated against the
 * debt excluding this settlement (its ledger id is `settlement:{id}`).
 */
export async function updateSettlementWithRepository(
  deps: SettlementWriteDeps,
  viewerUid: string,
  settlementId: string,
  input: SettlementInput,
): Promise<Settlement> {
  const existing = await requireSettlement(deps.repository, settlementId);
  assertSettlementParticipant(existing, viewerUid);

  if (existing.deletedAt !== null) {
    throw new SettlementOperationError("ALREADY_DELETED");
  }

  const value = validateSettlementOrThrow(input, viewerUid);
  const friendUid = getSettlementRecipient(existing, viewerUid);

  if (value.friendUid !== friendUid) {
    throw new SettlementOperationError("NOT_PARTICIPANT");
  }
  if (value.currency !== existing.currency) {
    throw new SettlementOperationError("CURRENCY_MISMATCH");
  }

  const viewerIsCreditor = existing.toUserId === viewerUid;
  assertCreditorWallet(value, viewerIsCreditor);

  if (
    !canEditSettlementAmount(existing, viewerUid) &&
    value.amountCents !== existing.amountCents
  ) {
    throw new SettlementOperationError("AMOUNT_LOCKED");
  }

  const balances = await loadSettlementBalances(
    deps.ledgerRepository,
    viewerUid,
    friendUid,
    existing.id,
  );
  assertSettlementDebtBound(balances, existing.currency, value.amountCents);

  const now = new Date().toISOString();
  const dto = buildUpdateSettlementDto({
    value,
    existing,
    viewerUid,
    now,
  });
  const recipientUid = getSettlementRecipient(existing, viewerUid);
  const isFull = isSettlementFull(
    balances,
    existing.currency,
    value.amountCents,
  );
  const notification = buildSettlementNotificationInput({
    settlement: {
      ...existing,
      amountCents: value.amountCents,
      date: value.date,
      note: value.note,
      updatedAt: now,
      receiverTransactionId:
        dto.receiverTransactionId === undefined
          ? existing.receiverTransactionId
          : dto.receiverTransactionId,
    },
    event: "updated",
    recipientUid,
    actorUid: viewerUid,
    isFull,
    canLinkWallet: resolveCanLinkWallet({
      settlement: existing,
      recipientUid,
      viewerIsCreditor,
      walletId: dto.receiverWalletId,
    }),
  });

  return deps.repository.updateSettlement(
    viewerUid,
    existing.id,
    dto,
    notification,
  );
}
