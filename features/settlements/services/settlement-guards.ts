import type { CurrencyCode } from "@/shared/constants/currencies";
import type { FriendBalance } from "@/features/friends/types/friend.types";
import {
  calculateFriendBalances,
} from "@/features/friends/utils/friend-balance";
import { createFriendPairId } from "@/features/friends/utils/friend-pair";
import type { IFriendLedgerRepository } from "@/features/friends/repositories/friend-ledger.repository";
import type { IFriendsRepository } from "@/features/friends/repositories/friends.repository";

import type { ISettlementsRepository } from "../repositories/settlements.repository";
import { validateSettlementInput } from "../schemas/settlement.schema";
import type {
  Settlement,
  SettlementInput,
  ValidatedSettlement,
} from "../types/settlement.types";
import {
  getOutstandingDebtCents,
  isAmountWithinDebt,
} from "../utils/settlement-debt";
import { getSettlementLedgerId } from "../utils/settlement-ledger";
import {
  SettlementOperationError,
  SettlementValidationError,
} from "./settlement.errors";

/** Settlements always belong to a signed-in user; blank ids are rejected. */
export function requireSettlementViewer(viewerUid: unknown): string {
  const viewer = typeof viewerUid === "string" ? viewerUid.trim() : "";

  if (viewer.length === 0) {
    throw new SettlementOperationError("SIGN_IN_REQUIRED");
  }

  return viewer;
}

export function assertSettlementParticipant(
  settlement: Settlement,
  viewerUid: string,
): void {
  if (!settlement.participantIds.includes(viewerUid)) {
    throw new SettlementOperationError("NOT_PARTICIPANT");
  }
}

/** Loads the record or fails with a stable code, never with a sentence. */
export async function requireSettlement(
  repository: ISettlementsRepository,
  settlementId: string,
): Promise<Settlement> {
  const id = settlementId.trim();
  const settlement = id.length > 0 ? await repository.getSettlement(id) : null;

  if (!settlement) throw new SettlementOperationError("SETTLEMENT_NOT_FOUND");

  return settlement;
}

/** The 1:1 slice only settles with an accepted friend, one document read. */
export async function assertSettlementFriendship(
  friendsRepository: IFriendsRepository,
  viewerUid: string,
  friendUid: string,
): Promise<void> {
  const pairId = createFriendPairId(viewerUid, friendUid);
  const friendship =
    pairId.length > 0 ? await friendsRepository.getFriendship(pairId) : null;

  if (!friendship) throw new SettlementOperationError("FRIEND_NOT_FOUND");
}

/**
 * Folds the composed pair ledger (`sharedExpenses` + `settlements`). Rules
 * cannot sum lists, so the debt bound lives here; a concurrent write can still
 * move the debt between this read and the write until TICKET-023.
 */
export async function loadSettlementBalances(
  ledgerRepository: IFriendLedgerRepository,
  viewerUid: string,
  friendUid: string,
  excludeSettlementId?: string,
): Promise<FriendBalance[]> {
  const entries = await ledgerRepository.getEntries(viewerUid);
  const excluded = excludeSettlementId
    ? getSettlementLedgerId(excludeSettlementId)
    : null;
  const usable = excluded
    ? entries.filter((entry) => entry.id !== excluded)
    : entries;

  return calculateFriendBalances(usable, viewerUid, friendUid);
}

/** Rejects a currency without debt and an amount above (or equal to zero). */
export function assertSettlementDebtBound(
  balances: readonly FriendBalance[],
  currency: CurrencyCode,
  amountCents: number,
): void {
  const debtCents = getOutstandingDebtCents(balances, currency);

  if (debtCents <= 0) throw new SettlementOperationError("NO_DEBT");

  if (!isAmountWithinDebt(amountCents, debtCents)) {
    throw new SettlementOperationError("AMOUNT_EXCEEDS_DEBT");
  }
}

/**
 * Only the creditor records the income, so a wallet sent by the debtor is a
 * validation failure of that field (the rules enforce the same invariant).
 */
export function assertCreditorWallet(
  value: ValidatedSettlement,
  viewerIsCreditor: boolean,
): void {
  if (!viewerIsCreditor && value.walletId !== null) {
    throw new SettlementValidationError([
      { field: "walletId", code: "WALLET_NOT_OWNED" },
    ]);
  }
}

/** Validates the form payload and throws the domain validation error. */
export function validateSettlementOrThrow(
  input: SettlementInput,
  viewerUid: string,
): ValidatedSettlement {
  const validation = validateSettlementInput(input, viewerUid);

  if (!validation.ok) throw new SettlementValidationError(validation.error);

  return validation.value;
}
