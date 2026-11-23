import type { IGroupsRepository } from "@/features/groups/repositories/groups.repository";

import type {
  IGroupExpensesRepository,
  IGroupExpenseLinkRepository,
} from "../repositories/group-expenses.repository";
import type { IGroupSettlementsRepository } from "../repositories/group-settlements.repository";
import type {
  GroupExpense,
  GroupExpenseInput,
} from "../types/group-expense.types";
import { sortGroupExpenses } from "../utils/group-expense-ledger";
import { GroupBalancesUseCases } from "./group-balances.usecases";
import {
  assertExpenseEditor,
  assertExpenseHasCurrentMembers,
  assertExpenseNotDeleted,
  assertGroupExpenseMember,
  assertPayerIsMember,
  assertSameGroup,
  requireGroupExpense,
  requireGroupExpenseViewer,
  requireGroupForExpense,
  validateGroupExpenseOrThrow,
} from "./group-expense-guards";
import {
  createGroupExpenseRecord,
  deleteGroupExpenseRecord,
  updateGroupExpenseRecord,
  type GroupExpenseWriteDeps,
} from "./group-expense-write";

/**
 * Group expenses (TICKET-009). The service owns membership, payer and
 * editor/permission guards; the repositories only talk to Firestore and the UI
 * translates the stable error codes.
 *
 * `linkRepository` handles the optional atomic pair "group expense + personal
 * movement" (TICKET-069) and is only used when the payer links a wallet. The
 * group ledger, the participant shares and the other members' balances never
 * depend on it: the movement is a personal mirror.
 */
export class GroupExpensesService extends GroupBalancesUseCases {
  private readonly writeDeps: GroupExpenseWriteDeps;

  constructor(
    repository: IGroupExpensesRepository,
    groupsRepository: IGroupsRepository,
    linkRepository: IGroupExpenseLinkRepository,
    settlementsRepository: IGroupSettlementsRepository,
  ) {
    super(repository, settlementsRepository, groupsRepository);
    this.writeDeps = { repository, linkRepository };
  }

  /** Every expense of the group, soft-deleted included for the audit trail. */
  async getGroupExpenses(
    viewerUid: string,
    groupId: string,
  ): Promise<GroupExpense[]> {
    const viewer = requireGroupExpenseViewer(viewerUid);
    const group = await requireGroupForExpense(this.groupsRepository, groupId);
    assertGroupExpenseMember(group, viewer);

    const expenses = await this.repository.getGroupExpenses(group.id);

    return sortGroupExpenses(expenses);
  }

  /** One expense; the viewer must be an active member of its group. */
  async getGroupExpense(
    viewerUid: string,
    expenseId: string,
  ): Promise<GroupExpense> {
    const viewer = requireGroupExpenseViewer(viewerUid);
    const expense = await requireGroupExpense(this.repository, expenseId);
    const group = await requireGroupForExpense(
      this.groupsRepository,
      expense.groupId,
    );
    assertGroupExpenseMember(group, viewer);

    return expense;
  }

  /** Any active group member can add an expense. */
  async createGroupExpense(
    viewerUid: string,
    input: GroupExpenseInput,
  ): Promise<GroupExpense> {
    const viewer = requireGroupExpenseViewer(viewerUid);
    const group = await requireGroupForExpense(
      this.groupsRepository,
      input.groupId,
    );
    assertGroupExpenseMember(group, viewer);

    const value = validateGroupExpenseOrThrow(input, viewer, group);
    assertPayerIsMember(value.payerId, group);

    return createGroupExpenseRecord(
      this.writeDeps,
      value,
      viewer,
      new Date().toISOString(),
    );
  }

  /** Owner, creator or payer only; the group and the creation stamp are fixed. */
  async updateGroupExpense(
    viewerUid: string,
    expenseId: string,
    input: GroupExpenseInput,
  ): Promise<GroupExpense> {
    const viewer = requireGroupExpenseViewer(viewerUid);
    const existing = await requireGroupExpense(this.repository, expenseId);
    const group = await requireGroupForExpense(
      this.groupsRepository,
      existing.groupId,
    );
    assertGroupExpenseMember(group, viewer);
    assertExpenseEditor(existing, group, viewer);
    assertSameGroup(input.groupId, existing);
    assertExpenseNotDeleted(existing);
    assertExpenseHasCurrentMembers(existing, group);

    const value = validateGroupExpenseOrThrow(input, viewer, group);
    assertPayerIsMember(value.payerId, group);

    return updateGroupExpenseRecord(
      this.writeDeps,
      existing,
      value,
      viewer,
      new Date().toISOString(),
    );
  }

  /** Idempotent: deleting an already deleted expense is a no-op, not an error. */
  async deleteGroupExpense(
    viewerUid: string,
    expenseId: string,
  ): Promise<void> {
    const viewer = requireGroupExpenseViewer(viewerUid);
    const existing = await requireGroupExpense(this.repository, expenseId);
    const group = await requireGroupForExpense(
      this.groupsRepository,
      existing.groupId,
    );
    assertGroupExpenseMember(group, viewer);
    assertExpenseEditor(existing, group, viewer);

    if (existing.deletedAt !== null) return;

    return deleteGroupExpenseRecord(
      this.writeDeps,
      existing,
      viewer,
      new Date().toISOString(),
    );
  }
}
