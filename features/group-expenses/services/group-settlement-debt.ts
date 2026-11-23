import type { CurrencyCode } from "@/shared/constants/currencies";

import type { IGroupExpensesRepository } from "../repositories/group-expenses.repository";
import type { IGroupSettlementsRepository } from "../repositories/group-settlements.repository";
import type {
  GroupDebt,
  GroupSettlementLedgerEntry,
} from "../types/group-balance.types";
import type { GroupSettlement } from "../types/group-settlement.types";
import { calculateGroupBalances } from "../utils/group-balances";
import { GroupExpenseOperationError } from "./group-expense.errors";

/** Structural ledger row of a recorded settlement, as the engine expects it. */
export function toGroupSettlementLedgerEntry(
  settlement: GroupSettlement,
): GroupSettlementLedgerEntry {
  return {
    fromUserId: settlement.fromUserId,
    toUserId: settlement.toUserId,
    amountCents: settlement.amountCents,
    currency: settlement.currency,
    deletedAt: settlement.deletedAt,
  };
}

export interface GroupPairDebtLookup {
  expensesRepository: IGroupExpensesRepository;
  settlementsRepository: IGroupSettlementsRepository;
  groupId: string;
  currency: CurrencyCode;
  fromUserId: string;
  toUserId: string;
  /**
   * The group **Simplificar deudas** setting. The pair is resolved from the same
   * view the UI renders, so tapping Liquidar on a simplified suggestion is
   * validated against the suggestion and never against a direct debt that does
   * not exist for that pair.
   */
  simplifyDebts: boolean;
  /** The edited settlement never counts against its own bound. */
  excludeSettlementId?: string;
}

function matchesPair(debt: GroupDebt, lookup: GroupPairDebtLookup): boolean {
  return (
    debt.currency === lookup.currency &&
    ((debt.fromUserId === lookup.fromUserId &&
      debt.toUserId === lookup.toUserId) ||
      (debt.fromUserId === lookup.toUserId &&
        debt.toUserId === lookup.fromUserId))
  );
}

/**
 * Live debt row of one pair in one currency: active expenses plus active
 * settlements, folded by the Phase A engine in the view the group renders
 * (simplified suggestions or direct debts). Rules cannot sum a ledger, so the
 * amount bound lives here; a concurrent write can still move the debt between
 * this read and the transaction.
 *
 * Returns `null` when the pair does not appear in that view, which the update
 * path handles with the stored amount (an existing settlement is never NO_DEBT).
 */
export async function loadGroupPairDebt(
  lookup: GroupPairDebtLookup,
): Promise<GroupDebt | null> {
  const [expenses, settlements] = await Promise.all([
    lookup.expensesRepository.getGroupExpenses(lookup.groupId),
    lookup.settlementsRepository.getGroupSettlements(lookup.groupId),
  ]);

  const entries = settlements
    .filter((settlement) => settlement.id !== lookup.excludeSettlementId)
    .map(toGroupSettlementLedgerEntry);

  const { debts } = calculateGroupBalances(
    expenses,
    entries,
    lookup.simplifyDebts,
  );

  return debts.find((debt) => matchesPair(debt, lookup)) ?? null;
}

/**
 * The stored pair debt decides the direction: `from` must be the debtor and
 * `to` the creditor. A settled pair has no row (`NO_DEBT`) and a swapped pair
 * is a direction error, never a silent sign flip.
 */
export function assertPairDebtDirection(
  debt: GroupDebt | null,
  fromUserId: string,
  toUserId: string,
): GroupDebt {
  if (!debt) throw new GroupExpenseOperationError("NO_DEBT");

  if (debt.fromUserId !== fromUserId || debt.toUserId !== toUserId) {
    throw new GroupExpenseOperationError("DIRECTION_MISMATCH");
  }

  return debt;
}

/** Partial settlements are allowed; more than the pair owes is not. */
export function assertAmountWithinPairDebt(
  debt: GroupDebt,
  amountCents: number,
): void {
  if (amountCents > debt.amountCents) {
    throw new GroupExpenseOperationError("AMOUNT_EXCEEDS_DEBT");
  }
}
