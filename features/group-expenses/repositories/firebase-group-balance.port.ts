import type {
  GroupMemberNet,
  IGroupBalancePort,
} from "@/features/groups/services/group-balance.port";

import { toGroupSettlementLedgerEntry } from "../services/group-settlement-debt";
import {
  calculateGroupNetBalances,
  getMemberNetBalances,
} from "../utils/group-balances";
import type { IGroupExpensesRepository } from "./group-expenses.repository";
import type { IGroupSettlementsRepository } from "./group-settlements.repository";

/**
 * TICKET-010 ledger read for TICKET-068's zero-balance guard. Reuses the same
 * engine the balances screen renders, so the guard and the UI never disagree;
 * soft-deleted records drop out inside the engine. Read budget: one
 * `groupExpenses` and one `groupSettlements` query (`groupId`-only, no
 * composite index), no group re-read (the service already loaded it).
 */
export class FirebaseGroupBalancePort implements IGroupBalancePort {
  constructor(
    private readonly expensesRepository: IGroupExpensesRepository,
    private readonly settlementsRepository: IGroupSettlementsRepository,
  ) {}

  async getMemberNets(
    groupId: string,
    memberId: string,
  ): Promise<GroupMemberNet[]> {
    const [expenses, settlements] = await Promise.all([
      this.expensesRepository.getGroupExpenses(groupId),
      this.settlementsRepository.getGroupSettlements(groupId),
    ]);
    const currencies = calculateGroupNetBalances(
      expenses,
      settlements.map(toGroupSettlementLedgerEntry),
    );

    return getMemberNetBalances(currencies, memberId);
  }
}
