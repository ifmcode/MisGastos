import type { IGroupsRepository } from "@/features/groups/repositories/groups.repository";

import type { IGroupExpensesRepository } from "../repositories/group-expenses.repository";
import type { IGroupSettlementsRepository } from "../repositories/group-settlements.repository";
import type {
  GroupBalances,
  GroupBalanceSummary,
} from "../types/group-balance.types";
import {
  loadGroupBalances,
  loadGroupBalanceSummaries,
} from "./group-balances.read";
import { requireGroupExpenseViewer } from "./group-expense-guards";

/**
 * Balance read use cases in their own class so `group-expenses.service.ts` keeps
 * the CRUD surface and both files stay under the size limit. The viewer and the
 * group membership are enforced here, the pure engine stays I/O free.
 */
export class GroupBalancesUseCases {
  protected constructor(
    protected readonly repository: IGroupExpensesRepository,
    protected readonly settlementsRepository: IGroupSettlementsRepository,
    protected readonly groupsRepository: IGroupsRepository,
  ) {}

  /** Raw nets and the transfer view of one group, member-only. */
  async getGroupBalances(
    viewerUid: string,
    groupId: string,
  ): Promise<GroupBalances> {
    const viewer = requireGroupExpenseViewer(viewerUid);

    return loadGroupBalances(
      this.repository,
      this.settlementsRepository,
      this.groupsRepository,
      viewer,
      groupId,
    );
  }

  /** The viewer's net per group, empty `balances` when settled. */
  async getGroupBalanceSummaries(
    viewerUid: string,
  ): Promise<GroupBalanceSummary[]> {
    const viewer = requireGroupExpenseViewer(viewerUid);

    return loadGroupBalanceSummaries(
      this.repository,
      this.settlementsRepository,
      this.groupsRepository,
      viewer,
    );
  }
}
