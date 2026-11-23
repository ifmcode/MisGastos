import type { IGroupsRepository } from "@/features/groups/repositories/groups.repository";

import type { IGroupExpensesRepository } from "../repositories/group-expenses.repository";
import type { IGroupSettlementsRepository } from "../repositories/group-settlements.repository";
import type {
  GroupBalances,
  GroupBalanceSummary,
} from "../types/group-balance.types";
import { compareGroupText } from "../utils/group-balance-order";
import {
  calculateGroupBalances,
  getViewerGroupBalance,
} from "../utils/group-balances";
import {
  assertGroupExpenseMember,
  requireGroupForExpense,
} from "./group-expense-guards";
import { toGroupSettlementLedgerEntry } from "./group-settlement-debt";

/**
 * Member-only balances of one group: the raw nets plus the transfer view chosen
 * by `group.simplifyDebts`. Soft-deleted expenses and settlements are filtered
 * by the engine; the settlement rows are mapped to the structural ledger entry
 * so the Phase A engine never imports the settlement module.
 */
export async function loadGroupBalances(
  repository: IGroupExpensesRepository,
  settlementsRepository: IGroupSettlementsRepository,
  groupsRepository: IGroupsRepository,
  viewerUid: string,
  groupId: string,
): Promise<GroupBalances> {
  const group = await requireGroupForExpense(groupsRepository, groupId);
  assertGroupExpenseMember(group, viewerUid);

  const [expenses, settlements] = await Promise.all([
    repository.getGroupExpenses(group.id),
    settlementsRepository.getGroupSettlements(group.id),
  ]);

  return calculateGroupBalances(
    expenses,
    settlements.map(toGroupSettlementLedgerEntry),
    group.simplifyDebts,
  );
}

/**
 * The viewer's net per group, group id ascending so the order never depends on
 * the query. Read budget: one `groups` query plus one `groupExpenses` and one
 * `groupSettlements` query per group (target: 20 groups -> 41 reads), each
 * filtered only by `groupId` and sorted client-side, so no composite index is
 * needed.
 */
export async function loadGroupBalanceSummaries(
  repository: IGroupExpensesRepository,
  settlementsRepository: IGroupSettlementsRepository,
  groupsRepository: IGroupsRepository,
  viewerUid: string,
): Promise<GroupBalanceSummary[]> {
  const groups = [...(await groupsRepository.getGroups(viewerUid))].sort(
    (left, right) => compareGroupText(left.id, right.id),
  );
  const summaries: GroupBalanceSummary[] = [];

  for (const group of groups) {
    const [expenses, settlements] = await Promise.all([
      repository.getGroupExpenses(group.id),
      settlementsRepository.getGroupSettlements(group.id),
    ]);
    const balances = calculateGroupBalances(
      expenses,
      settlements.map(toGroupSettlementLedgerEntry),
      group.simplifyDebts,
    );

    summaries.push({
      groupId: group.id,
      balances: getViewerGroupBalance(balances, viewerUid),
    });
  }

  return summaries;
}
