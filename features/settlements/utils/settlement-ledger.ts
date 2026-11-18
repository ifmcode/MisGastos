import type {
  Settlement,
  SettlementLedgerEntry,
} from "../types/settlement.types";

/** Prefix of a settlement ledger id, so it never collides with an expense id. */
export const SETTLEMENT_LEDGER_ID_PREFIX = "settlement:";

/** Active means "applied": a soft-deleted settlement never counts again. */
export function isActiveSettlement(settlement: Settlement): boolean {
  return settlement.deletedAt === null || settlement.deletedAt.length === 0;
}

export function filterActiveSettlements(
  settlements: readonly Settlement[],
): Settlement[] {
  return settlements.filter(isActiveSettlement);
}

export function getSettlementLedgerId(settlementId: string): string {
  return `${SETTLEMENT_LEDGER_ID_PREFIX}${settlementId}`;
}

/**
 * `FriendLedgerEntry` means "`fromUserId` owes `toUserId`", and a settlement is
 * money that cancels debt. Emitting the stored direction would double the debt,
 * so the helper writes the REVERSE edge: the creditor owes the debtor as much as
 * the debtor just paid. With that, `calculateFriendBalances` and the per-currency
 * fold stay untouched and no currency is converted.
 *
 * Only active settlements feed the ledger; soft-deleted ones never count. The
 * `settlement:` id prefix lets an edit exclude the entry being edited.
 */
export function buildSettlementLedgerEntries(
  settlements: readonly Settlement[],
): SettlementLedgerEntry[] {
  return filterActiveSettlements(settlements).map((settlement) => ({
    id: getSettlementLedgerId(settlement.id),
    fromUserId: settlement.toUserId,
    toUserId: settlement.fromUserId,
    amountCents: settlement.amountCents,
    currency: settlement.currency,
    deletedAt: null,
  }));
}
